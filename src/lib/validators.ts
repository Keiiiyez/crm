
const SPANISH_BANKS: Record<string, string> = {
  "2038": "Bankia (CaixaBank)", "2100": "CaixaBank", "0049": "Banco Santander",
  "0081": "Banco Sabadell", "0182": "BBVA", "0128": "Bankinter",
  "2048": "Liberbank", "2080": "Abanca", "2085": "Ibercaja",
  "2095": "Kutxabank", "3058": "Cajamar", "0019": "Deutsche Bank",
  "1465": "ING Bank", "0075": "Banco Popular", "0239": "EVO Banco",
  "2103": "Unicaja Banco", "0073": "Openbank", "2090": "ImaginBank",
  "0083": "Renta 4 Banco", "0125": "Bancofar", "0130": "Banco Caixa Geral",
  "0131": "Banco Sabadell", "0138": "Bank Degroof Petercam", "0151": "JP Morgan"
};


export const validateSpanishID = (id: string): boolean => {
  const cleaned = id.toUpperCase().trim();
  if (!/^[A-Z0-9][0-9]{7}[A-Z0-9]$/.test(cleaned)) return false;

  const firstChar = cleaned[0];
  const lastChar = cleaned[8];


  if (/[0-9XYZ]/.test(firstChar)) {
    const mapping: Record<string, string> = { 'X': '0', 'Y': '1', 'Z': '2' };
    const prefix = mapping[firstChar as keyof typeof mapping] || firstChar;
    const number = parseInt(prefix + cleaned.slice(1, 8), 10);
    return lastChar === "TRWAGMYFPDXBNJZSQVHLCKE"[number % 23];
  }

 
  if (/[ABCDEFGHJNPQRSUVW]/.test(firstChar)) {
    const digits = cleaned.slice(1, 8);
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      let n = parseInt(digits[i], 10);
      if (i % 2 !== 0) sum += n;
      else {
        n *= 2;
        sum += n > 9 ? n - 9 : n;
      }
    }
    const controlDigit = (10 - (sum % 10)) % 10;
    const controlLetter = "JABCDEFGHI"[controlDigit];

    if (/[KPQSVW]/.test(firstChar)) return lastChar === controlLetter;
    if (/[ABEH]/.test(firstChar)) return lastChar === controlDigit.toString();
    return lastChar === controlLetter || lastChar === controlDigit.toString();
  }
  return false;
};


export const validateIBAN = (iban: string): { isValid: boolean; bankName?: string; isSpanish?: boolean } => {
  const cleaned = iban.replace(/\s/g, '').toUpperCase();
  
  if (cleaned.length < 15 || !/^[A-Z]{2}\d{2}[A-Z\d]+$/.test(cleaned)) {
    return { isValid: false };
  }

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);

  const numericStr = rearranged
    .split('')
    .map(char => {
      const code = char.charCodeAt(0);
      return code >= 65 && code <= 90 ? (code - 55).toString() : char;
    })
    .join('');

  try {
   
    const isIsoValid = BigInt(numericStr) % BigInt(97) === BigInt(1);
    
    if (!isIsoValid) return { isValid: false };

    if (cleaned.startsWith("ES")) {
      const bankCode = cleaned.substring(4, 8);
      return { 
        isValid: true, 
        bankName: SPANISH_BANKS[bankCode] || "Entidad Española",
        isSpanish: true 
      };
    }

    return { isValid: true, bankName: "IBAN Extranjero", isSpanish: false };
  } catch (e) {
    return { isValid: false };
  }
};


export const formatIBAN = (value: string): string => {
  const v = value.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 34);
  const parts = v.match(/.{1,4}/g);
  return parts ? parts.join(' ') : v;
};