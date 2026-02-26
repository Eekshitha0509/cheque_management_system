export default function AllCheques() {
  const cheques = [
    { id: '101', vendor: 'ABC Corp', amount: '$5,000', status: 'Cleared' },
    { id: '102', vendor: 'XYZ Services', amount: '$1,200', status: 'Pending' },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Cheques</h1>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b">
            <th className="py-2">Cheque #</th>
            <th>Vendor</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {cheques.map((c) => (
            <tr key={c.id} className="border-b hover:bg-gray-50">
              <td className="py-2">{c.id}</td>
              <td>{c.vendor}</td>
              <td>{c.amount}</td>
              <td>{c.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}