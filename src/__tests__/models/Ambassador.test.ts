import {
    calculateConversionRate,
    calculatePointsValue,
    isEligibleForPayout,
    generateReferralCode,
    validateReferralCode,
    AmbassadorPerformance,
    Wallet
} from '../../models/Ambassador';

describe('Ambassador Model Helper Functions', () => {
    describe('calculateConversionRate', () => {
        it('should calculate conversion rate correctly', () => {
            const performance: AmbassadorPerformance = {
                totalReferrals: 100,
                successfulConversions: 25,
                totalEarnings: 5000,
                currentPoints: 250,
                lifetimePoints: 500
            };

            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(25); // 25%
        });

        it('should return 0 for zero referrals', () => {
            const performance: AmbassadorPerformance = {
                totalReferrals: 0,
                successfulConversions: 0,
                totalEarnings: 0,
                currentPoints: 0,
                lifetimePoints: 0
            };

            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(0);
        });

        it('should handle edge case with conversions but no referrals', () => {
            const performance: AmbassadorPerformance = {
                totalReferrals: 0,
                successfulConversions: 5, // This shouldn't happen in practice
                totalEarnings: 1000,
                currentPoints: 100,
                lifetimePoints: 100
            };

            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(0);
        });

        it('should calculate high conversion rate correctly', () => {
            const performance: AmbassadorPerformance = {
                totalReferrals: 10,
                successfulConversions: 9,
                totalEarnings: 4500,
                currentPoints: 450,
                lifetimePoints: 450
            };

            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(90); // 90%
        });
    });

    describe('calculatePointsValue', () => {
        it('should calculate points value with default conversion rate', () => {
            const points = 100;
            const value = calculatePointsValue(points);
            expect(value).toBe(100); // 1:1 ratio by default
        });

        it('should calculate points value with custom conversion rate', () => {
            const points = 100;
            const conversionRate = 0.5; // 1 point = 0.5 currency units
            const value = calculatePointsValue(points, conversionRate);
            expect(value).toBe(50);
        });

        it('should handle zero points', () => {
            const points = 0;
            const value = calculatePointsValue(points);
            expect(value).toBe(0);
        });

        it('should handle fractional conversion rates', () => {
            const points = 150;
            const conversionRate = 1.25; // 1 point = 1.25 currency units
            const value = calculatePointsValue(points, conversionRate);
            expect(value).toBe(187.5);
        });
    });

    describe('isEligibleForPayout', () => {
        it('should return true for wallet with sufficient points (default minimum)', () => {
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: 150,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 150,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            const eligible = isEligibleForPayout(wallet);
            expect(eligible).toBe(true);
        });

        it('should return false for wallet with insufficient points (default minimum)', () => {
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: 50,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 50,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            const eligible = isEligibleForPayout(wallet);
            expect(eligible).toBe(false);
        });

        it('should return true for wallet meeting custom minimum', () => {
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: 250,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 250,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            const eligible = isEligibleForPayout(wallet, 200);
            expect(eligible).toBe(true);
        });

        it('should return false for wallet not meeting custom minimum', () => {
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: 150,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 150,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            const eligible = isEligibleForPayout(wallet, 200);
            expect(eligible).toBe(false);
        });

        it('should handle edge case with exactly minimum points', () => {
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: 100,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 100,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            const eligible = isEligibleForPayout(wallet, 100);
            expect(eligible).toBe(true);
        });
    });

    describe('generateReferralCode', () => {
        it('should generate referral code with correct format', () => {
            const userId = 'user-123456789';
            const code = generateReferralCode(userId);

            expect(code).toMatch(/^REF[A-Z0-9]+$/);
            expect(code.length).toBeLessThanOrEqual(12);
            expect(code.startsWith('REF')).toBe(true);
        });

        it('should generate different codes for different users', () => {
            const userId1 = 'user-123';
            const userId2 = 'user-456';

            const code1 = generateReferralCode(userId1);
            const code2 = generateReferralCode(userId2);

            expect(code1).not.toBe(code2);
        });

        it('should include user hash in the code', () => {
            const userId = 'user-abcd1234';
            const code = generateReferralCode(userId);

            // Should contain the last 4 characters of userId in uppercase
            expect(code).toContain('1234'.toUpperCase());
        });

        it('should handle short user IDs', () => {
            const userId = 'u1';
            const code = generateReferralCode(userId);

            expect(code).toMatch(/^REF[A-Z0-9]+$/);
            expect(code.length).toBeLessThanOrEqual(12);
        });
    });

    describe('validateReferralCode', () => {
        it('should validate correct referral code format', () => {
            const validCodes = [
                'REF12345',
                'REFABC123',
                'REF1A2B3C',
                'REFABCDEF123'
            ];

            validCodes.forEach(code => {
                expect(validateReferralCode(code)).toBe(true);
            });
        });

        it('should reject invalid referral code formats', () => {
            const invalidCodes = [
                'ref12345', // lowercase prefix
                'ABC12345', // wrong prefix
                'REF', // too short
                'REF1', // too short
                'REF1234', // too short
                'REF123456789012345', // too long
                'REF123!@#', // invalid characters
                'REF 12345', // contains space
                '', // empty string
                'REFABCDEFGHIJ123' // too long (16 chars total, max is 12)
            ];

            invalidCodes.forEach(code => {
                expect(validateReferralCode(code)).toBe(false);
            });
        });

        it('should handle edge cases', () => {
            expect(validateReferralCode('REF12345')).toBe(true); // minimum valid length
            expect(validateReferralCode('REFABCDEF123')).toBe(true); // maximum valid length
            expect(validateReferralCode('REF1234')).toBe(false); // one character short
        });
    });

    describe('Integration Tests', () => {
        it('should work together for complete ambassador workflow', () => {
            // Generate referral code
            const userId = 'ambassador-user-123';
            const referralCode = generateReferralCode(userId);

            // Validate the generated code
            expect(validateReferralCode(referralCode)).toBe(true);

            // Create performance data
            const performance: AmbassadorPerformance = {
                totalReferrals: 50,
                successfulConversions: 15,
                totalEarnings: 7500,
                currentPoints: 750,
                lifetimePoints: 1000
            };

            // Calculate conversion rate
            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(30); // 15/50 * 100

            // Create wallet
            const wallet: Wallet = {
                id: 'wallet-123',
                userId: userId,
                userType: 'ambassador',
                balance: {
                    points: performance.currentPoints,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: performance.totalEarnings,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            // Check payout eligibility
            expect(isEligibleForPayout(wallet)).toBe(true);

            // Calculate payout value
            const payoutValue = calculatePointsValue(wallet.balance.points, 1);
            expect(payoutValue).toBe(750);
        });

        it('should handle ambassador with no conversions', () => {
            const performance: AmbassadorPerformance = {
                totalReferrals: 10,
                successfulConversions: 0,
                totalEarnings: 0,
                currentPoints: 100, // Still got registration bonuses
                lifetimePoints: 100
            };

            const conversionRate = calculateConversionRate(performance);
            expect(conversionRate).toBe(0);

            const wallet: Wallet = {
                id: 'wallet-123',
                userId: 'user-123',
                userType: 'ambassador',
                balance: {
                    points: performance.currentPoints,
                    credits: 0,
                    currency: 'INR'
                },
                totalEarned: 0,
                totalSpent: 0,
                totalWithdrawn: 0
            };

            // Should still be eligible for payout if they have enough points
            expect(isEligibleForPayout(wallet)).toBe(true);
        });
    });
});