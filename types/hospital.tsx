
type Hospital = {
  id: string;
  name: string;
  slogan?: string;
  location: string;
  address?: string;
  email?: string;
  phone?: string;
  description?: string;
  status?: string;
  subscriptionType?: string;
  subscriptionAmount?: number;
  subscriptionPatientRange?: string;
  createdAt?: any;
  totalPatients?: number;
};


export default Hospital;