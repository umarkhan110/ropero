import express from 'express';
import Packages from '../models/Packages.js';

const router = express.Router();

// Create a new Package
router.post('/create-package', async (req, res) => {
    try {
      const { package_name, package_desc, credits, amount } = req.body;
      const Package = await Packages .create({ package_name, package_desc, credits, amount });
      res.status(201).json(Package);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'An error occurred while creating a Package.' });
    }
  });
  
  // Get Packages
  router.get('/get-all-packages', async (req, res) => {
    try {
      const Packages = await Packages.findAll();
      res.json(Packages);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  );
  
  // Get Package Detail by Id
router.get('/view-package/:id', async (req, res) => {
  const packageId = req.params.id;

  try {
    const packageRes = await Packages.findByPk(packageId);

    if (!packageRes) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({  packageRes});
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});
  // Update Package by Id
  router.put('/update-package/:id', async (req, res) => {
    try {
      const packageId = req.params.id;
      const { package_name, package_desc, credits, amount } = req.body;
      const Package = await Packages.findByPk(packageId);
  
      if (!Package) {
        return res.status(404).json({ message: 'Package not found' });
      }
      Package.package_name = package_name ? package_name : Package.package_name;
      Package.package_desc = package_desc ? package_desc : Package.package_desc;
      Package.amount = amount;
      Package.credits = credits;
      await Package.save();
      return res.json({ message: 'Package updated successfully' });
    } catch (error) {
  
      res.status(500).json({ error: error });
    }
  });
  
  // Delete Packages by ID
  router.delete("/delete-package/:id", async (req, res) => {
    try {
      const packageId = req.params.id;
      const Package = await Packages.findByPk(packageId);
  
      if (!Package) {
        return res.status(404).json({ error: "Packages not found" });
      }
  
      // Delete the Package
      await Package.destroy();
  
      return res.status(200).json({ message: "Packages removed successfully." });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  export default router