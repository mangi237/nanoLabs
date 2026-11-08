import React from 'react';
import { SuperAdminLayout, type SuperAdminNavTab } from '../../components/Layout/SuperAdminLayout';
import { useAuth } from '../../context/authContext';
import { usePortalNavigation } from '../../hooks/usePortalNavigation';
import { ResourcePage, type Column } from '../../components/portal/ResourcePage';
const pages:Record<string,{title:string;columns:Column[]}>= {
  labs:{title:'Partner laboratories',columns:[{key:'name',label:'Laboratory'},{key:'city',label:'City'},{key:'status',label:'Status'},{key:'accredited',label:'Accreditation recorded'},{key:'plan',label:'Package'}]},
  users:{title:'Platform users',columns:[{key:'name',label:'Name'},{key:'role',label:'Role'},{key:'status',label:'Status'},{key:'labId',label:'Laboratory'}]},
  catalog:{title:'Master test catalog',columns:[{key:'name',label:'Test'},{key:'labName',label:'Laboratory'},{key:'price',label:'Price (XAF)'},{key:'category',label:'Category'}]},
  settlements:{title:'Monthly settlements',columns:[{key:'labName',label:'Laboratory'},{key:'month',label:'Month'},{key:'confirmedInvoices',label:'Confirmed invoices'},{key:'feeDue',label:'Platform fees (XAF)'}]},
  audit:{title:'System audit trail',columns:[{key:'stage',label:'Event'},{key:'actorRole',label:'Role'},{key:'timestamp',label:'Time'}]},
  health:{title:'System health',columns:[{key:'label',label:'Check'},{key:'value',label:'Observed status'}]}
};
export const SuperAdminApp:React.FC=()=>{const{logout}=useAuth();const[page,navigate]=usePortalNavigation('platform','labs');const config=pages[page];return <SuperAdminLayout currentTab={page as SuperAdminNavTab} onTabChange={navigate} onLogout={logout}>{config?<ResourcePage key={page} title={config.title} endpoint={`/api/portal/platform/${page}`} columns={config.columns}/>:<section><h1>Page not found</h1><button onClick={()=>navigate('labs')}>Partner labs</button></section>}</SuperAdminLayout>;};
export default SuperAdminApp;
