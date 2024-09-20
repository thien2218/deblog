export const capitalize = jest.fn((str: string) => {
	return str.charAt(0).toUpperCase() + str.slice(1);
});

export const initializeLucia = jest.fn();
