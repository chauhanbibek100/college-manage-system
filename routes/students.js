const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const DateSheet = require('../models/DateSheet');
const Result = require('../models/Result');
const auth = require('../middleware/auth');

router.get('/classes', auth, async (req, res) => {
    try {
        const studentClasses = await Student.distinct('className');
        
        const list = studentClasses
            .filter(c => c && typeof c === 'string' && c.trim().length > 0)
            .map(c => c.trim())
            .filter((c, index, self) => self.indexOf(c) === index)
            .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
            
        res.json(list);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.className && typeof req.query.className === 'string') {
            query.className = req.query.className.trim();
        }
        const students = await Student.find(query).sort({ name: 1 });
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const { name, rollNo, className } = req.body;
        if (!name || !rollNo || !className || typeof name !== 'string' || typeof rollNo !== 'string' || typeof className !== 'string') {
            return res.status(400).json({ error: 'Name, Roll No, and Class Name are required' });
        }
        const student = new Student(req.body);
        await student.save();
        res.status(201).json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/upgrade/batch', auth, async (req, res) => {
    try {
        const { fromClass, targetClass } = req.body;
        if (!fromClass || !targetClass) {
            return res.status(400).json({ error: 'Both current class and target class are required' });
        }
        const result = await Student.updateMany(
            { className: fromClass.trim() },
            { $set: { className: targetClass.trim() } }
        );
        res.json({ message: `Successfully upgraded ${result.modifiedCount} student(s) to ${targetClass.trim()}` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id/upgrade', auth, async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        let targetClass = req.body.targetClass;
        if (!targetClass) {
            let currentClass = parseInt(student.className, 10);
            if (!isNaN(currentClass)) {
                targetClass = (currentClass + 1).toString();
            } else {
                return res.status(400).json({ error: 'Please specify the target class name to upgrade to' });
            }
        }
        
        student.className = targetClass.trim();
        await student.save();
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!student) return res.status(404).json({ error: 'Student not found' });
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const student = await Student.findByIdAndDelete(req.params.id);
        if (!student) return res.status(404).json({ error: 'Student not found' });
        
        const Fee = require('../models/Fee');
        await Fee.deleteMany({ studentId: req.params.id });

        const remainingInClass = await Student.countDocuments({ className: student.className });
        if (remainingInClass === 0) {
            await DateSheet.deleteMany({ className: student.className });
            await Result.deleteMany({ className: student.className });
        }

        res.json({ message: 'Student deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
