const express = require('express');
const router = express.Router();
const Fee = require('../models/Fee');
const Student = require('../models/Student');
const auth = require('../middleware/auth');

// Helper function to calculate 30-day fee cycles for a student
function calculateStudentCycles(student, allFees) {
    let regDateStr = student.registrationDate || student.createdAt;
    let regDate = regDateStr ? new Date(regDateStr) : new Date();
    if (isNaN(regDate.getTime())) {
        regDate = new Date();
    }

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    // Sort all fee payments by paymentDate ascending (FIFO order)
    const sortedFees = [...allFees].sort((a, b) => new Date(a.paymentDate) - new Date(b.paymentDate));

    // Calculate total months covered across all fee receipts
    const feeMonthSlots = [];
    sortedFees.forEach(fee => {
        const count = Math.max(1, parseInt(fee.monthsCovered, 10) || 1);
        for (let m = 1; m <= count; m++) {
            feeMonthSlots.push({
                fee,
                monthIndex: m,
                totalMonths: count
            });
        }
    });

    const totalPaidMonths = feeMonthSlots.length;

    const cycles = [];
    let cycleNo = 1;
    let cycleStart = new Date(regDate);

    // Generate cycles: at least up to today, plus any cycles that have been paid in advance,
    // plus exactly 1 upcoming pending cycle if all currently generated cycles are paid
    while (cycleStart <= today || cycleNo <= totalPaidMonths || (cycleNo === totalPaidMonths + 1)) {
        const dueDate = new Date(cycleStart);
        dueDate.setDate(dueDate.getDate() + 29); // 30-day cycle window

        cycles.push({
            cycleNo,
            cycleStart: cycleStart.toISOString().split('T')[0],
            dueDate: dueDate.toISOString().split('T')[0]
        });

        cycleNo++;
        cycleStart = new Date(cycleStart);
        cycleStart.setDate(cycleStart.getDate() + 30);

        if (cycleNo > totalPaidMonths + 1 && cycleStart > today) {
            break;
        }
    }

    // Sequentially assign payments to cycles in order of cycleNo
    const enrichedCycles = cycles.map((cycle, index) => {
        if (index < feeMonthSlots.length) {
            const slot = feeMonthSlots[index];
            return {
                ...cycle,
                status: 'paid',
                fee: slot.fee,
                monthInFee: slot.monthIndex,
                feeTotalMonths: slot.totalMonths
            };
        }
        return { ...cycle, status: 'pending', fee: null };
    });

    const firstPending = enrichedCycles.find(c => c.status === 'pending');
    const nextDueDate = firstPending ? firstPending.dueDate : null;
    const isOverdue = nextDueDate ? (new Date(nextDueDate) < new Date()) : false;

    return {
        cycles: enrichedCycles,
        nextDueDate,
        isOverdue,
        totalPaid: enrichedCycles.filter(c => c.status === 'paid').length,
        totalPending: enrichedCycles.filter(c => c.status === 'pending').length,
        firstPendingCycleNo: firstPending ? firstPending.cycleNo : (totalPaidMonths + 1)
    };
}

// GET /api/fees/history/:studentId
router.get('/history/:studentId', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.studentId).lean();
        if (!student) return res.status(404).json({ error: 'Student not found' });

        const allFees = await Fee.find({ studentId: req.params.studentId })
            .sort({ paymentDate: 1 })
            .lean();

        const cycleData = calculateStudentCycles(student, allFees);

        res.json({
            student: {
                _id: student._id,
                name: student.name,
                rollNo: student.rollNo,
                className: student.className,
                registrationDate: student.registrationDate,
                parentContact: student.parentContact || '',
                isHostler: student.isHostler || false
            },
            ...cycleData
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.className) {
            query.className = req.query.className;
        }
        if (req.query.studentId) {
            query.studentId = req.query.studentId;
        }
        const fees = await Fee.find(query).sort({ paymentDate: -1 });
        res.json(fees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/students', auth, async (req, res) => {
    try {
        const className = req.query.className;
        if (!className) {
            return res.status(400).json({ error: 'className query parameter is required' });
        }
        const students = await Student.find({ className }).lean();
        const studentFees = await Promise.all(students.map(async (student) => {
            const allFees = await Fee.find({ studentId: student._id }).sort({ paymentDate: 1 }).lean();
            const latestFee = allFees.length > 0 ? allFees[allFees.length - 1] : null;
            const cycleData = calculateStudentCycles(student, allFees);

            return {
                student,
                latestFee: latestFee || null,
                nextDueDate: cycleData.nextDueDate,
                isOverdue: cycleData.isOverdue,
                totalPending: cycleData.totalPending,
                firstPendingCycleNo: cycleData.firstPendingCycleNo
            };
        }));
        res.json(studentFees);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


router.post('/', auth, async (req, res) => {
    try {
        const { studentId, studentName, className, amount, paymentDate, monthsCovered, remarks } = req.body;
        const months = Math.max(1, parseInt(monthsCovered, 10) || 1);

        // Determine cycle range for this payment
        const existingFees = await Fee.find({ studentId }).sort({ paymentDate: 1 }).lean();
        const prevMonthsPaid = existingFees.reduce((sum, f) => sum + (Math.max(1, parseInt(f.monthsCovered, 10) || 1)), 0);
        const cycleFrom = prevMonthsPaid + 1;
        const cycleTo = prevMonthsPaid + months;

        const receiptNo = 'RCP-' + Date.now();
        const fee = new Fee({
            studentId,
            studentName,
            className,
            amount: Number(amount),
            paymentDate,
            receiptNo,
            monthsCovered: months,
            cycleRange: {
                from: cycleFrom,
                to: cycleTo
            },
            remarks: remarks || ''
        });
        await fee.save();
        res.status(201).json(fee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/receipt/:id', auth, async (req, res) => {
    try {
        const fee = await Fee.findById(req.params.id);
        if (!fee) return res.status(404).json({ error: 'Fee record not found' });
        res.json(fee);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
