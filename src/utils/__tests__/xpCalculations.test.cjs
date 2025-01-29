const { calculateTaskXP } = require("../xpCalculations");

describe('calculateTaskXP', () => {
    test('calculates XP correctly for easy task with low priority', () => {
        const result = calculateTaskXP('easy', 'low');
        expect(result).toBe(50);
    });

    test('calculates XP correctly for hard task with high priority', () => {
        const result = calculateTaskXP('hard', 'high');
        expect(result).toBe(225);
    });
});