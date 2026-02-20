/**
 * DICCIONARIO AMPLIADO DE ENTIDADES BANCARIAS ESPAÑOLAS
 */
const SPANISH_BANKS: Record<string, string> = {
  "2038": "Bankia (CaixaBank)", "2100": "CaixaBank", "0049": "Banco Santander",
  "0081": "Banco Sabadell", "0182": "BBVA", "0128": "Bankinter",
  "2048": "Liberbank", "2080": "Abanca", "2085": "Ibercaja",
  "2095": "Kutxabank", "3058": "Cajamar", "0019": "Deutsche Bank",
  "1465": "ING Bank", "0239": "EVO Banco", "2103": "Unicaja Banco",
  "0073": "Openbank", "2090": "ImaginBank", "0083": "Renta 4 Banco",
  "0125": "Bancofar", "0130": "Banco Caixa Geral", "0138": "Bank Degroof Petercam",
  "0151": "JP Morgan", "0030": "Banesto", "0072": "Banco Pastor",
  "0075": "Banco Popular", "0229": "Banco Popular-e", "0238": "Banco Pastor (Nuevo)",
  "0061": "Banca March", "0078": "Banca Pueyo", "0131": "Novo Banco",
  "0133": "MicroBank", "0186": "Banco Mediolanum", "0198": "Bco. Cooperativo Español",
  "0216": "Targobank", "0234": "Banco Caminos", "0235": "Banco Pichincha",
  "0237": "Cajasur Banco", "1491": "Triodos Bank", "1550": "Banca Popolare Etica",
  "2045": "Caja Ontinyent", "2056": "Colonya - Caixa Pollensa", "3183": "Arquia Bank",
  "3001": "Caja Rural de Almendralejo", "3005": "Caja Rural Central", "3007": "Caja Rural de Gijón",
  "3008": "Caja Rural de Navarra", "3009": "Caja Rural de Extremadura", "3016": "Caja Rural de Salamanca",
  "3017": "Caja Rural de Soria", "3018": "Caja Rural de Fuente Álamo", "3020": "Caja Rural de Utrera",
  "3023": "Caja Rural de Granada", "3025": "Caixa d'Enginyers", "3029": "Caja Rural de Petrel",
  "3035": "Laboral Kutxa", "3045": "Caixa Rural Altea", "3059": "Caja Rural de Asturias",
  "3060": "Caja Rural de Burgos", "3067": "Caja Rural de Jaén", "3070": "Caixa Rural Galega",
  "3076": "Caja Siete", "3080": "Caja Rural de Teruel", "3081": "Eurocaja Rural",
  "3085": "Caja Rural de Zamora", "3089": "Caja Rural de Baena", "3095": "Caja Rural San Roque de Almenara",
  "3096": "Caixa Rural de L'Alcudia", "3098": "Caja Rural de Nueva Carteya", "3102": "Caixa Rural San Vicent Ferrer",
  "3104": "Caja Rural de Cañete de las Torres", "3105": "Caixa Rural de Callosa d'en Sarrià", "3110": "Caja Rural Católico Agraria",
  "3112": "Caja Rural San José de Burriana", "3113": "Caja Rural San José de Alcora", "3115": "Caja Rural Nuestra Madre del Sol",
  "3117": "Caixa Rural d'Algemesí", "3118": "Caixa Rural Torrent", "3119": "Caja Rural San Jaime",
  "3121": "Caja Rural de Cheste", "3123": "Caixa Rural de Turis", "3127": "Caja Rural de Casas Ibáñez",
  "3130": "Caja Rural San José de Almassora", "3134": "Caja Rural de Onda", "3135": "Caja Rural San José de Nules",
  "3138": "Ruralnostra", "3140": "Caja Rural de Guissona", "3144": "Caja Rural de Villamalea",
  "3150": "Caja Rural de Albal", "3152": "Caja Rural de Villar", "3157": "Caja Rural de Chilches",
  "3159": "Caixa Popular", "3160": "Caixa Rural de Vilavella", "3162": "Caixa Rural Benicarló",
  "3165": "Caja Rural de Vilafamés", "3166": "Caixa Rural Les Coves de Vinromà", "3174": "Caixa Rural Vinaròs",
  "3179": "Caja Rural de Alginet", "3187": "Caja Rural del Sur", "3190": "Globalcaja", "3191": "Caja Rural de Aragón"
};


export const validateSpanishID = (id: string): boolean => {
  let cleaned = id.toUpperCase().trim();
  
  if (cleaned.length === 8 && /^[0-9]+[A-Z]$/.test(cleaned)) {
    cleaned = "0" + cleaned;
  }

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