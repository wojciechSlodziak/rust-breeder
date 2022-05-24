enum GeneEnum {
  G = 'G',
  H = 'H',
  Y = 'Y',
  W = 'W',
  X = 'X',

  // BASE GENE - Non-dominant gene on a result sapling - in crossbreeding process base plant's gene will remain.
  B = 'B',

  // MOCK GREEN - Represents a base gene that has to by of any green type.
  // This can be required when specific red gene is expected, and crossbreeding will not work for base sapling with another red gene on the same position.
  // Example: single W will not replace X on base sapling.
  MG = 'MG',

  // MOCK ANY - Represents a base gene that can be of any type.
  MA = 'MA'
}

export default GeneEnum;
