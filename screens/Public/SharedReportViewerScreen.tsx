import React, { useEffect, useState } from 'react';
import { apiJson } from '../../services/apiClient';
export const SharedReportViewerScreen: React.FC<{ onGoToLogin: () => void; onGoToWebsite?: () => void }> = ({ onGoToLogin }) => {
  const token = new URLSearchParams(window.location.search).get('share') ?? '';
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    if (!/^[a-f0-9]{64}$/.test(token)) { setError('This report link is invalid. Ask the patient for a new secure link.'); return; }
    apiJson(`/api/public/reports/${token}`).then(result => { if (active) setReport(result.report); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [token]);
  return <main className="max-w-3xl mx-auto p-6 space-y-5"><h1 className="text-2xl font-bold">Shared laboratory report</h1>
    {error ? <p role="alert" className="text-red-700">{error}</p> : !report ? <p>Loading report…</p> : <>
      <h2 className="text-xl font-semibold">{report.patientName} · {report.labName}</h2>
      <p>Released by {report.biologistName} · {new Date(report.biologistSignedAt).toLocaleString()}</p>
      {report.tests.map((test: any) => <section key={test.id} className="border rounded-xl p-4 space-y-2"><h3 className="font-bold">{test.testName}</h3><p>{test.resultValue} {test.units}</p>
        {test.subParameters?.filter((p: any) => p.value).map((p: any, i: number) => <p key={i}>{p.name}: {p.value} {p.unit}</p>)}
        {test.labNotes && <p>{test.labNotes}</p>}
      </section>)}<button onClick={() => window.print()} className="border rounded-xl p-3">Print report</button></>}
    <button onClick={onGoToLogin} className="block text-teal-800 underline">Go to sign in</button>
  </main>;
};
export default SharedReportViewerScreen;
