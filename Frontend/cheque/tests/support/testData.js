export const testUsers = {
  valid: {
    username: 'testuser',
    password: 'testpassword',
    email: 'test@example.com',
    fullName: 'Test User',
    mobile_number: '9876543210',
    bank_name: 'HDFC'
  },
  invalid: {
    username: 'invaliduser',
    password: 'wrongpassword',
    email: 'invalid@example.com'
  }
};

export const chequePurposes = [
  'Salary Payment',
  'Rent Payment',
  'Vendor Payment',
  'Invoice Payment',
  'Loan Repayment',
  'Tuition Fee',
  'Utility Bill',
  'Insurance Premium',
  'Donation',
  'Personal Transfer'
];

export const testData = {
  cheque: {
    chequeNumber: '123456',
    payee: 'Test Payee',
    amount: 5000,
    date: new Date().toISOString().split('T')[0]
  },
  profile: {
    balance: 100000,
    bankName: 'HDFC Bank',
    mobile: '9876543210'
  }
};
