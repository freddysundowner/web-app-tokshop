import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();
const BASE_URL = process.env.BASE_URL || 'https://api.iconaapp.com';

// PUT /auction/bid/:id - Place a bid or prebid on an auction
router.put('/bid/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    const auctionId = req.params.id;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const response = await fetch(`${BASE_URL}/auction/bid/${auctionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.json(data);
  } catch (error: any) {
    console.error('Error placing bid:', error);
    res.status(500).json({ error: error.message || 'Failed to place bid' });
  }
});

export default router;
