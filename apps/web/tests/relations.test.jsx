import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Relations from '../src/pages/Relations';
import api from '../src/api/axios';
import React from 'react';

// Mock axios
vi.mock('../src/api/axios', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('Relations Page Component', () => {
  const mockDormant = [
    {
      id: 'dormant-1',
      name: 'Dormant Sipho',
      phone: '0831112222',
      daysInactive: 15,
      suggestedPromoEnglish: 'Hi Sipho! English outreach promo',
      suggestedPromoZulu: 'Sawubona Sipho! Zulu outreach promo',
    }
  ];

  const mockAllCustomers = [
    { id: 'dormant-1', name: 'Dormant Sipho', phone: '0831112222' },
    { id: 'loyal-1', name: 'Loyal Zanele', phone: '0723334444' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Stub api.get endpoint calls
    api.get.mockImplementation((url) => {
      if (url === '/customers/dormant') {
        return Promise.resolve({ data: mockDormant });
      }
      if (url === '/customers') {
        return Promise.resolve({ data: mockAllCustomers });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  it('renders dormant outreach list by default', async () => {
    render(<Relations />);

    // Wait for dormant customers to populate
    await waitFor(() => {
      expect(screen.getByText('Dormant Sipho')).toBeInTheDocument();
      expect(screen.getByText('15 days inactive')).toBeInTheDocument();
    });

    // Check default is Zulu prompt
    expect(screen.getByText('"Sawubona Sipho! Zulu outreach promo"')).toBeInTheDocument();

    // Toggle to English
    const englishBtn = screen.getByText('English');
    fireEvent.click(englishBtn);

    // Verify it updates draft
    expect(screen.getByText('"Hi Sipho! English outreach promo"')).toBeInTheDocument();
  });

  it('navigates to Reward Loyal Customers tab and generates a coupon', async () => {
    render(<Relations />);

    // Wait for initial load
    await waitFor(() => {
      expect(screen.getByText('Dormant Sipho')).toBeInTheDocument();
    });

    // Click on Reward tab
    const rewardTab = screen.getByText('Reward Loyal Customers');
    fireEvent.click(rewardTab);

    // Verify loyal customer is rendered (Dormant customer is excluded from active loyalty rewards)
    await waitFor(() => {
      expect(screen.getByText('Loyal Zanele')).toBeInTheDocument();
      expect(screen.queryByText('Dormant Sipho')).not.toBeInTheDocument();
    });

    // Generate reward
    const generateBtn = screen.getByText('Generate Reward');
    fireEvent.click(generateBtn);

    // Verify Modal details
    expect(screen.getByText('Recipient Customer')).toBeInTheDocument();
    expect(screen.getByText('Loyal Zanele (0723334444)')).toBeInTheDocument();
    expect(screen.getByText('Reward Code')).toBeInTheDocument();

    // Verify Coupon Zulu message draft
    expect(screen.getByText(/Sawubona Loyal Zanele! Siyabonga ngokukhetha i-Simon Family Farm/)).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByText('Close');
    fireEvent.click(closeBtn);

    expect(screen.queryByText('Recipient Customer')).not.toBeInTheDocument();
  });
});
