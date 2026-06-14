import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CameraScanner from '../src/components/POS/CameraScanner';
import api from '../src/api/axios';
import React from 'react';

// Mock axios
vi.mock('../src/api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('CameraScanner Component', () => {
  const mockProducts = [
    { id: '1', name: 'Beef T-Bone', barcode: '1004', pricingType: 'WEIGHT_BASED', unit: 'kg', isActive: true },
    { id: '2', name: 'Boerewors', barcode: '1002', pricingType: 'WEIGHT_BASED', unit: 'kg', isActive: true },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockProducts });
    
    // Mock navigator.mediaDevices.getUserMedia
    if (!navigator.mediaDevices) {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: {
          getUserMedia: vi.fn().mockRejectedValue(new Error('No camera')),
        },
        writable: true,
      });
    } else {
      vi.spyOn(navigator.mediaDevices, 'getUserMedia').mockRejectedValue(new Error('No camera'));
    }
  });

  it('renders dropdown and simulates EAN-13 barcode generation and scan', async () => {
    const handleScan = vi.fn();
    const handleClose = vi.fn();

    render(
      <CameraScanner isOpen={true} onClose={handleClose} onScan={handleScan} />
    );

    // Wait for dropdown options to populate and barcode to generate
    await waitFor(() => {
      expect(screen.getByText('Beef T-Bone (Weight-Based)')).toBeInTheDocument();
      expect(screen.getByText('2010040012500')).toBeInTheDocument();
    });

    // Trigger click on Simulate button
    const simButton = screen.getByText('Simulate Scale Scan');
    fireEvent.click(simButton);

    expect(handleScan).toHaveBeenCalledWith('2010040012500');
  });

  it('calls onClose when Cancel button is clicked', async () => {
    const handleScan = vi.fn();
    const handleClose = vi.fn();

    render(
      <CameraScanner isOpen={true} onClose={handleClose} onScan={handleScan} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(handleClose).toHaveBeenCalled();
  });
});
