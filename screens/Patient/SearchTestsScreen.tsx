import React, { useState } from 'react';
import { MASTER_TESTS_CATALOG, MasterTestItem } from '../../data/final_catalog';
export type TestCatalogItem = MasterTestItem;
export { MASTER_TESTS_CATALOG };
export const POPULAR_CATALOG_TESTS = MASTER_TESTS_CATALOG.slice(0, 10);

interface SearchTestsScreenProps {
  availableTests?: MasterTestItem[];
  onBack: () => void;
  onSelectTest: (test: MasterTestItem) => void;
  onSelectMultipleTests?: (tests: MasterTestItem[]) => void;
  onSelectPackage?: () => void;
  onOpenAIHelp?: () => void;
}


export const SearchTestsScreen: React.FC<SearchTestsScreenProps> = ({ availableTests = [], onBack, onSelectTest, onSelectMultipleTests }) => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<MasterTestItem[]>([]);
  const tests = availableTests.filter(test => `${test.name} ${test.category}`.toLowerCase().includes(search.toLowerCase()));
  return <main className="max-w-3xl mx-auto p-5 space-y-5"><button onClick={onBack} className="underline">Back</button><h1 className="text-2xl font-bold">Choose your tests</h1><p>These tests are listed by laboratories currently accepting bookings. Review preparation instructions with the performing laboratory.</p><label className="block">Search tests<input value={search} onChange={e => setSearch(e.target.value)} className="block w-full border rounded-xl p-3" /></label>
    {!availableTests.length && <p>No laboratory tests are currently available.</p>}
    {tests.map(test => <section key={test.id} className="bg-white border rounded-xl p-4 flex justify-between gap-4 items-center"><label className="flex items-center gap-3"><input type="checkbox" checked={selected.some(item => item.name === test.name)} onChange={e => setSelected(current => e.target.checked ? [...current, test] : current.filter(item => item.name !== test.name))} /><span><strong>{test.name}</strong><span className="block text-sm">{test.category}</span></span></label><button className="text-teal-800 underline" onClick={() => onSelectTest(test)}>Choose this test</button></section>)}
    <button disabled={!selected.length} onClick={() => onSelectMultipleTests ? onSelectMultipleTests(selected) : onSelectTest(selected[0])} className="bg-teal-800 text-white p-4 rounded-xl disabled:opacity-40">Compare laboratories for {selected.length} selected test(s)</button>
  </main>;
};
