import React from 'react';
export function BookingResults({ booking }: { booking: any }) {
  return <section className="space-y-4"><h2 className="text-xl font-bold">{booking.resultsReleased ? 'Released laboratory results' : 'Results awaiting release'}</h2>{booking.biologistSignedAt && <p>Released by {booking.biologistName} · {new Date(booking.biologistSignedAt).toLocaleString()}</p>}
    {booking.tests.map((test: any) => <article key={test.id} className="bg-white border rounded-xl p-4 space-y-2"><h3 className="font-semibold">{test.testName}</h3><p className="whitespace-pre-wrap">{test.resultValue} {test.units}</p>{test.subParameters?.filter((p: any) => p.value).map((p: any, i: number) => <p key={i}>{p.name}: {p.value} {p.unit}</p>)}{test.labNotes && <p>{test.labNotes}</p>}</article>)}
  </section>;
}
