// Mock data for Counsel — JK Shukla & Associates

export const clients = [
  { id: 'CL001', name: 'Rajesh Kumar Verma', type: 'Individual', phone: '+91 98765 43210', email: 'rajesh.verma@email.com', address: 'A-12, Sector 62, Noida', matters: 2, status: 'active', addedDate: '2024-08-15' },
  { id: 'CL002', name: 'Priya Sharma', type: 'Individual', phone: '+91 87654 32109', email: 'priya.sharma@email.com', address: '45, Civil Lines, Lucknow', matters: 1, status: 'active', addedDate: '2024-09-02' },
  { id: 'CL003', name: 'Mehta Industries Pvt. Ltd.', type: 'Corporate', phone: '+91 11 2345 6789', email: 'legal@mehtaindustries.com', address: 'DLF Cyber Hub, Gurugram', matters: 3, status: 'active', addedDate: '2024-07-20' },
  { id: 'CL004', name: 'Sunita Devi', type: 'Individual', phone: '+91 76543 21098', email: 'sunita.devi@email.com', address: '78, Hazratganj, Lucknow', matters: 1, status: 'active', addedDate: '2024-10-10' },
  { id: 'CL005', name: 'Bharat Construction Co.', type: 'Corporate', phone: '+91 522 234 5678', email: 'info@bharatconstruction.in', address: 'Gomti Nagar, Lucknow', matters: 2, status: 'active', addedDate: '2024-06-15' },
  { id: 'CL006', name: 'Anand Prakash Mishra', type: 'Individual', phone: '+91 65432 10987', email: 'anand.mishra@email.com', address: 'Aliganj, Lucknow', matters: 1, status: 'inactive', addedDate: '2024-03-22' },
  { id: 'CL007', name: 'Lakshmi Textiles Ltd.', type: 'Corporate', phone: '+91 522 876 5432', email: 'legal@lakshmitextiles.com', address: 'Chinhat Industrial Area, Lucknow', matters: 1, status: 'active', addedDate: '2024-11-01' },
  { id: 'CL008', name: 'Vikram Singh Chauhan', type: 'Individual', phone: '+91 54321 09876', email: 'vikram.chauhan@email.com', address: 'Mahanagar, Lucknow', matters: 1, status: 'active', addedDate: '2024-11-15' },
];

export const cases = [
  { id: 'CS/2024/001', title: 'Verma vs. State of UP', client: 'Rajesh Kumar Verma', clientId: 'CL001', court: 'High Court, Lucknow', caseType: 'Criminal Appeal', filingDate: '2024-08-20', status: 'active', nextHearing: '2024-12-02', description: 'Criminal appeal against conviction under Section 420 IPC.' },
  { id: 'CS/2024/002', title: 'Sharma Property Dispute', client: 'Priya Sharma', clientId: 'CL002', court: 'Civil Court, Lucknow', caseType: 'Civil Suit', filingDate: '2024-09-10', status: 'active', nextHearing: '2024-12-05', description: 'Property partition suit regarding ancestral property in Civil Lines.' },
  { id: 'CS/2024/003', title: 'Mehta Industries vs. UPPCB', client: 'Mehta Industries Pvt. Ltd.', clientId: 'CL003', court: 'NGT, Delhi', caseType: 'Environmental', filingDate: '2024-07-25', status: 'active', nextHearing: '2024-12-10', description: 'Appeal against pollution control board order for factory closure.' },
  { id: 'CS/2024/004', title: 'Sunita Devi vs. Ramesh Prasad', client: 'Sunita Devi', clientId: 'CL004', court: 'Family Court, Lucknow', caseType: 'Family', filingDate: '2024-10-15', status: 'active', nextHearing: '2024-12-03', description: 'Maintenance petition under Section 125 CrPC.' },
  { id: 'CS/2024/005', title: 'Bharat Construction Labour Dispute', client: 'Bharat Construction Co.', clientId: 'CL005', court: 'Labour Court, Lucknow', caseType: 'Labour', filingDate: '2024-06-20', status: 'active', nextHearing: '2024-12-08', description: 'Dispute regarding wrongful termination of contract workers.' },
  { id: 'CS/2024/006', title: 'Verma Tax Assessment Appeal', client: 'Rajesh Kumar Verma', clientId: 'CL001', court: 'ITAT, Lucknow', caseType: 'Tax', filingDate: '2024-09-05', status: 'pending', nextHearing: '2024-12-15', description: 'Appeal against income tax reassessment order for AY 2021-22.' },
  { id: 'CS/2024/007', title: 'Mehta Industries vs. ABC Corp', client: 'Mehta Industries Pvt. Ltd.', clientId: 'CL003', court: 'Commercial Court, Delhi', caseType: 'Commercial', filingDate: '2024-08-01', status: 'active', nextHearing: '2024-12-12', description: 'Commercial suit for recovery of dues under supply agreement.' },
  { id: 'CS/2024/008', title: 'Bharat Construction Land Acquisition', client: 'Bharat Construction Co.', clientId: 'CL005', court: 'High Court, Lucknow', caseType: 'Civil Writ', filingDate: '2024-11-01', status: 'active', nextHearing: '2024-12-18', description: 'Writ petition challenging land acquisition notification.' },
  { id: 'CS/2024/009', title: 'Mishra Cheque Bounce Case', client: 'Anand Prakash Mishra', clientId: 'CL006', court: 'Magistrate Court, Lucknow', caseType: 'Criminal', filingDate: '2024-03-25', status: 'closed', nextHearing: null, description: 'Complaint under Section 138 NI Act. Matter settled.' },
  { id: 'CS/2024/010', title: 'Mehta Industries Trademark', client: 'Mehta Industries Pvt. Ltd.', clientId: 'CL003', court: 'IPAB, Delhi', caseType: 'IP', filingDate: '2024-10-20', status: 'pending', nextHearing: '2024-12-20', description: 'Trademark opposition proceedings for product brand registration.' },
  { id: 'CS/2024/011', title: 'Lakshmi Textiles GST Appeal', client: 'Lakshmi Textiles Ltd.', clientId: 'CL007', court: 'GST Tribunal, Lucknow', caseType: 'Tax', filingDate: '2024-11-05', status: 'active', nextHearing: '2024-12-22', description: 'Appeal against GST demand order for input tax credit reversal.' },
  { id: 'CS/2024/012', title: 'Chauhan Motor Accident Claim', client: 'Vikram Singh Chauhan', clientId: 'CL008', court: 'MACT, Lucknow', caseType: 'Motor Accident', filingDate: '2024-11-18', status: 'active', nextHearing: '2025-01-05', description: 'Compensation claim for injuries in road traffic accident.' },
];

export const hearings = [
  { id: 'H001', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', client: 'Rajesh Kumar Verma', court: 'High Court, Lucknow', date: '2024-11-27', time: '10:30', type: 'Arguments', status: 'today', notes: 'Final arguments from prosecution side. Carry previous order sheets.' },
  { id: 'H002', caseId: 'CS/2024/004', caseTitle: 'Sunita Devi vs. Ramesh Prasad', client: 'Sunita Devi', court: 'Family Court, Lucknow', date: '2024-11-27', time: '11:00', type: 'Evidence', status: 'today', notes: 'Cross-examination of respondent\'s witness. Documents filed.' },
  { id: 'H003', caseId: 'CS/2024/002', caseTitle: 'Sharma Property Dispute', client: 'Priya Sharma', court: 'Civil Court, Lucknow', date: '2024-11-28', time: '10:00', type: 'Arguments', status: 'upcoming', notes: 'Written arguments to be submitted.' },
  { id: 'H004', caseId: 'CS/2024/005', caseTitle: 'Bharat Construction Labour Dispute', client: 'Bharat Construction Co.', court: 'Labour Court, Lucknow', date: '2024-11-29', time: '11:30', type: 'Conciliation', status: 'upcoming', notes: 'Conciliation hearing. Settlement proposal ready.' },
  { id: 'H005', caseId: 'CS/2024/003', caseTitle: 'Mehta Industries vs. UPPCB', client: 'Mehta Industries Pvt. Ltd.', court: 'NGT, Delhi', date: '2024-12-02', time: '10:30', type: 'Hearing', status: 'upcoming', notes: 'Compliance report to be filed. Expert affidavit pending.' },
  { id: 'H006', caseId: 'CS/2024/007', caseTitle: 'Mehta Industries vs. ABC Corp', client: 'Mehta Industries Pvt. Ltd.', court: 'Commercial Court, Delhi', date: '2024-12-05', time: '14:00', type: 'Arguments', status: 'upcoming', notes: 'Oral arguments on application for interim relief.' },
  { id: 'H007', caseId: 'CS/2024/006', caseTitle: 'Verma Tax Assessment Appeal', client: 'Rajesh Kumar Verma', court: 'ITAT, Lucknow', date: '2024-12-10', time: '10:00', type: 'Hearing', status: 'upcoming', notes: 'Appeal hearing. All documents filed with registry.' },
  { id: 'H008', caseId: 'CS/2024/008', caseTitle: 'Bharat Construction Land Acquisition', client: 'Bharat Construction Co.', court: 'High Court, Lucknow', date: '2024-12-12', time: '10:30', type: 'Admission', status: 'upcoming', notes: 'Matter listed for admission. Urgent application filed.' },
  { id: 'H009', caseId: 'CS/2024/010', caseTitle: 'Mehta Industries Trademark', client: 'Mehta Industries Pvt. Ltd.', court: 'IPAB, Delhi', date: '2024-12-15', time: '11:00', type: 'Hearing', status: 'upcoming', notes: 'Opposition hearing. Counter-statement filed.' },
  { id: 'H010', caseId: 'CS/2024/011', caseTitle: 'Lakshmi Textiles GST Appeal', client: 'Lakshmi Textiles Ltd.', court: 'GST Tribunal, Lucknow', date: '2024-12-18', time: '10:00', type: 'Arguments', status: 'upcoming', notes: 'Submission of written brief and supporting documents.' },
];

export const documents = [
  { id: 'DOC001', name: 'Vakalatnama - Verma Case', category: 'Court Filing', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', uploadDate: '2024-08-20', size: '245 KB', type: 'PDF' },
  { id: 'DOC002', name: 'Written Arguments - Criminal Appeal', category: 'Legal Brief', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', uploadDate: '2024-11-20', size: '1.2 MB', type: 'PDF' },
  { id: 'DOC003', name: 'Property Survey Report', category: 'Evidence', caseId: 'CS/2024/002', caseTitle: 'Sharma Property Dispute', uploadDate: '2024-10-05', size: '3.8 MB', type: 'PDF' },
  { id: 'DOC004', name: 'Sale Deed - 1998', category: 'Evidence', caseId: 'CS/2024/002', caseTitle: 'Sharma Property Dispute', uploadDate: '2024-09-15', size: '890 KB', type: 'PDF' },
  { id: 'DOC005', name: 'Environmental Compliance Report', category: 'Expert Report', caseId: 'CS/2024/003', caseTitle: 'Mehta Industries vs. UPPCB', uploadDate: '2024-11-15', size: '5.2 MB', type: 'PDF' },
  { id: 'DOC006', name: 'Maintenance Application', category: 'Court Filing', caseId: 'CS/2024/004', caseTitle: 'Sunita Devi vs. Ramesh Prasad', uploadDate: '2024-10-15', size: '340 KB', type: 'PDF' },
  { id: 'DOC007', name: 'Employment Records - Workers', category: 'Evidence', caseId: 'CS/2024/005', caseTitle: 'Bharat Construction Labour Dispute', uploadDate: '2024-07-10', size: '2.1 MB', type: 'PDF' },
  { id: 'DOC008', name: 'Income Tax Notice', category: 'Correspondence', caseId: 'CS/2024/006', caseTitle: 'Verma Tax Assessment Appeal', uploadDate: '2024-09-08', size: '156 KB', type: 'PDF' },
  { id: 'DOC009', name: 'Supply Agreement - ABC Corp', category: 'Contract', caseId: 'CS/2024/007', caseTitle: 'Mehta Industries vs. ABC Corp', uploadDate: '2024-08-05', size: '1.8 MB', type: 'PDF' },
  { id: 'DOC010', name: 'Land Acquisition Notification', category: 'Government Order', caseId: 'CS/2024/008', caseTitle: 'Bharat Construction Land Acquisition', uploadDate: '2024-11-02', size: '420 KB', type: 'PDF' },
  { id: 'DOC011', name: 'Trademark Application - Mehta', category: 'IP Filing', caseId: 'CS/2024/010', caseTitle: 'Mehta Industries Trademark', uploadDate: '2024-10-22', size: '780 KB', type: 'PDF' },
  { id: 'DOC012', name: 'GST Demand Order', category: 'Government Order', caseId: 'CS/2024/011', caseTitle: 'Lakshmi Textiles GST Appeal', uploadDate: '2024-11-06', size: '1.1 MB', type: 'PDF' },
  { id: 'DOC013', name: 'FIR Copy - Accident', category: 'Police Record', caseId: 'CS/2024/012', caseTitle: 'Chauhan Motor Accident Claim', uploadDate: '2024-11-18', size: '290 KB', type: 'PDF' },
  { id: 'DOC014', name: 'Medical Certificate - Chauhan', category: 'Medical', caseId: 'CS/2024/012', caseTitle: 'Chauhan Motor Accident Claim', uploadDate: '2024-11-19', size: '510 KB', type: 'PDF' },
];

export const payments = [
  { id: 'PAY001', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', client: 'Rajesh Kumar Verma', amount: 150000, date: '2024-08-25', mode: 'Bank Transfer', status: 'received', description: 'Initial retainer fee' },
  { id: 'PAY002', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', client: 'Rajesh Kumar Verma', amount: 75000, date: '2024-11-01', mode: 'UPI', status: 'received', description: 'Hearing fee - November' },
  { id: 'PAY003', caseId: 'CS/2024/002', caseTitle: 'Sharma Property Dispute', client: 'Priya Sharma', amount: 100000, date: '2024-09-12', mode: 'Cheque', status: 'received', description: 'Consultation and filing fee' },
  { id: 'PAY004', caseId: 'CS/2024/003', caseTitle: 'Mehta Industries vs. UPPCB', client: 'Mehta Industries Pvt. Ltd.', amount: 500000, date: '2024-07-28', mode: 'Bank Transfer', status: 'received', description: 'Retainer for environmental matter' },
  { id: 'PAY005', caseId: 'CS/2024/003', caseTitle: 'Mehta Industries vs. UPPCB', client: 'Mehta Industries Pvt. Ltd.', amount: 200000, date: '2024-10-15', mode: 'Bank Transfer', status: 'received', description: 'Expert consultation fee' },
  { id: 'PAY006', caseId: 'CS/2024/004', caseTitle: 'Sunita Devi vs. Ramesh Prasad', client: 'Sunita Devi', amount: 25000, date: '2024-10-18', mode: 'Cash', status: 'received', description: 'Filing and initial consultation' },
  { id: 'PAY007', caseId: 'CS/2024/005', caseTitle: 'Bharat Construction Labour Dispute', client: 'Bharat Construction Co.', amount: 200000, date: '2024-06-25', mode: 'Bank Transfer', status: 'received', description: 'Retainer fee' },
  { id: 'PAY008', caseId: 'CS/2024/001', caseTitle: 'Verma vs. State of UP', client: 'Rajesh Kumar Verma', amount: 75000, date: '2024-12-05', mode: 'Pending', status: 'outstanding', description: 'December hearing fee' },
  { id: 'PAY009', caseId: 'CS/2024/005', caseTitle: 'Bharat Construction Labour Dispute', client: 'Bharat Construction Co.', amount: 100000, date: '2024-12-01', mode: 'Pending', status: 'outstanding', description: 'Second installment' },
  { id: 'PAY010', caseId: 'CS/2024/007', caseTitle: 'Mehta Industries vs. ABC Corp', client: 'Mehta Industries Pvt. Ltd.', amount: 350000, date: '2024-08-05', mode: 'Bank Transfer', status: 'received', description: 'Commercial suit retainer' },
  { id: 'PAY011', caseId: 'CS/2024/007', caseTitle: 'Mehta Industries vs. ABC Corp', client: 'Mehta Industries Pvt. Ltd.', amount: 150000, date: '2024-12-10', mode: 'Pending', status: 'outstanding', description: 'Arguments phase fee' },
  { id: 'PAY012', caseId: 'CS/2024/008', caseTitle: 'Bharat Construction Land Acquisition', client: 'Bharat Construction Co.', amount: 300000, date: '2024-11-05', mode: 'Bank Transfer', status: 'received', description: 'Writ petition filing fee' },
  { id: 'PAY013', caseId: 'CS/2024/011', caseTitle: 'Lakshmi Textiles GST Appeal', client: 'Lakshmi Textiles Ltd.', amount: 175000, date: '2024-11-08', mode: 'Bank Transfer', status: 'received', description: 'Appeal filing and consultation' },
  { id: 'PAY014', caseId: 'CS/2024/012', caseTitle: 'Chauhan Motor Accident Claim', client: 'Vikram Singh Chauhan', amount: 50000, date: '2024-11-20', mode: 'Cash', status: 'received', description: 'Initial consultation fee' },
  { id: 'PAY015', caseId: 'CS/2024/004', caseTitle: 'Sunita Devi vs. Ramesh Prasad', client: 'Sunita Devi', amount: 15000, date: '2024-12-08', mode: 'Pending', status: 'outstanding', description: 'Evidence stage fee' },
];

export const activities = [
  { id: 1, type: 'hearing', text: 'Hearing scheduled for Verma vs. State of UP', time: '2 hours ago', icon: 'calendar' },
  { id: 2, type: 'document', text: 'Written Arguments uploaded for Criminal Appeal', time: '4 hours ago', icon: 'file' },
  { id: 3, type: 'payment', text: '₹1,75,000 received from Lakshmi Textiles Ltd.', time: '6 hours ago', icon: 'banknote' },
  { id: 4, type: 'client', text: 'New client Vikram Singh Chauhan registered', time: 'Yesterday', icon: 'user-plus' },
  { id: 5, type: 'case', text: 'Chauhan Motor Accident Claim filed at MACT', time: 'Yesterday', icon: 'briefcase' },
  { id: 6, type: 'document', text: 'Medical Certificate uploaded for Chauhan case', time: 'Yesterday', icon: 'file' },
  { id: 7, type: 'payment', text: '₹3,00,000 received from Bharat Construction', time: '2 days ago', icon: 'banknote' },
  { id: 8, type: 'case', text: 'Bharat Construction Land Acquisition writ filed', time: '2 days ago', icon: 'briefcase' },
  { id: 9, type: 'hearing', text: 'Hearing date fixed for Lakshmi Textiles GST Appeal', time: '3 days ago', icon: 'calendar' },
  { id: 10, type: 'document', text: 'GST Demand Order uploaded', time: '3 days ago', icon: 'file' },
];

export const notifications = [
  { id: 1, title: 'Hearing today at 10:30 AM', text: 'Verma vs. State of UP — High Court, Lucknow', time: '30 min ago', unread: true },
  { id: 2, title: 'Hearing today at 11:00 AM', text: 'Sunita Devi vs. Ramesh Prasad — Family Court', time: '30 min ago', unread: true },
  { id: 3, title: 'Payment overdue', text: '₹75,000 pending from Rajesh Kumar Verma', time: '1 day ago', unread: true },
  { id: 4, title: 'Document review required', text: 'Environmental Compliance Report needs verification', time: '2 days ago', unread: false },
  { id: 5, title: 'New filing deadline', text: 'Bharat Construction Land Acquisition — reply due Dec 5', time: '3 days ago', unread: false },
];

export const caseDistribution = [
  { name: 'Civil', value: 3, fill: '#1a1d2b' },
  { name: 'Criminal', value: 2, fill: '#b8963e' },
  { name: 'Tax', value: 2, fill: '#6b8f71' },
  { name: 'Labour', value: 1, fill: '#c4694a' },
  { name: 'Commercial', value: 1, fill: '#8a8d96' },
  { name: 'Environmental', value: 1, fill: '#2e3348' },
  { name: 'IP', value: 1, fill: '#a0833a' },
  { name: 'Motor Accident', value: 1, fill: '#b4b7bf' },
];

export const user = {
  name: 'Advocate J.K. Shukla',
  initials: 'JKS',
  role: 'Managing Partner',
  firm: 'JK Shukla & Associates',
  email: 'jk.shukla@counsel.in',
};
