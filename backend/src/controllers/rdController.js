const RDTest = require('../models/RDTest');

// @desc    Get all R&D tests
// @route   GET /api/rd
// @access  Public
exports.getRDTests = async (req, res) => {
  try {
    const tests = await RDTest.find().populate('customer', 'name code').populate('product', 'colorCode colorName');
    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};

// @desc    Create new R&D Test
// @route   POST /api/rd
// @access  Public
exports.createRDTest = async (req, res) => {
  try {
    // Generate requestCode automatically if not provided
    if (!req.body.requestCode) {
      const count = await RDTest.countDocuments();
      req.body.requestCode = `RD-2024-${String(count + 1).padStart(3, '0')}`;
    }
    const test = await RDTest.create(req.body);
    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Add new test version
// @route   POST /api/rd/:id/versions
// @access  Public
exports.addVersion = async (req, res) => {
  try {
    const test = await RDTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'R&D Test not found' });
    }

    test.versions.push(req.body);
    
    // Auto update status if test passed
    if (req.body.result === 'pass') {
      test.status = 'approved';
    } else {
      test.status = 'testing';
    }

    await test.save();
    
    // We need to fetch again with populate and virtuals
    const updatedTest = await RDTest.findById(req.params.id).populate('customer', 'name code');
    
    res.status(200).json({ success: true, data: updatedTest });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

// @desc    Technical Sign-off
// @route   PATCH /api/rd/:id/sign
// @access  Public
exports.techSignOff = async (req, res) => {
  try {
    const test = await RDTest.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, error: 'R&D Test not found' });
    }

    // Check if there is at least 1 pass
    const hasPass = test.versions.some(v => v.result === 'pass');
    if (!hasPass) {
      return res.status(400).json({ success: false, error: 'Cannot sign off. At least one version must PASS.' });
    }

    test.signedBy = req.body.signedBy || 'Technical Lead';
    test.signedAt = Date.now();
    await test.save();

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
