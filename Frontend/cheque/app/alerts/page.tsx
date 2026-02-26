export default function AlertsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-red-600">Alerts & Notifications</h1>
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
          <strong>Overdue:</strong> Cheque #102 for XYZ Services is past its due date.
        </div>
      </div>
    </div>
  );
}