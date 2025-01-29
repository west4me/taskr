const calculateTaskXP = (difficulty, priority) => {
    const baseXP = {
        easy: 50,
        medium: 100,
        hard: 150,
    }[difficulty];

    const priorityMultiplier = {
        low: 1,
        medium: 1.2,
        high: 1.5,
    }[priority];

    return Math.round(baseXP * priorityMultiplier);
};

module.exports = { calculateTaskXP };