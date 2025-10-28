export const validateCost = (cost: any): { isValid: boolean; value: number; error: string } => {
  let costValue: number;
  
  if (typeof cost === 'number') {
    costValue = cost;
  } else if (typeof cost === 'string') {
    const cleanCost = cost.replace(/[^0-9.-]+/g, '');
    costValue = parseFloat(cleanCost);
  } else {
    return { isValid: false, value: 0, error: 'Cost must be a number' };
  }
  
  if (isNaN(costValue)) {
    return { isValid: false, value: 0, error: 'Cost must be a valid number' };
  }
  
  if (costValue < 0) {
    return { isValid: false, value: costValue, error: 'Cost cannot be negative' };
  }
  
  return { isValid: true, value: costValue, error: '' };
};

export const validateLink = (link: any): any => {
  const  linkRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/
  return link.match(linkRegex)
}