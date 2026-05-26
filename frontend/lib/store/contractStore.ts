import { create } from 'zustand';
import api from '../utils/axiosAuth';

export interface ContractDetail {
  productName: string;
  colorCode: string;
  quantity: number;
  unitPrice: number;
  technicalReqs: string;
}

export interface ContractData {
  _id: string;
  contractId: string;
  title: string;
  customer: any;
  employee?: any;
  value: number;
  smartContractAddress: string;
  documentHash: string;
  ipfsCid: string;
  txHash: string;
  status: string;
  vtscAddress: string;
  clientAddress: string;
  slaDeadline?: string;
  terms: {
    sla?: string;
    penalty?: string;
    duration?: string;
  };
  chiTietHopDong: ContractDetail[];
  vtscSignature: string;
  clientSignature: string;
  createdAt: string;
  updatedAt: string;
}

interface ContractState {
  contracts: ContractData[];
  currentContract: ContractData | null;
  loading: boolean;
  error: string | null;

  fetchContracts: () => Promise<void>;
  fetchContractById: (id: string) => Promise<void>;
  createContract: (data: any) => Promise<ContractData | null>;
  generatePreview: (id: string) => Promise<{ documentHash: string; ipfsCid: string; pdfUrl: string } | null>;
  deployOnChain: (id: string, clientAddress?: string) => Promise<{ txHash: string } | null>;
  signContract: (id: string, party: string, signature: string, txHash: string) => Promise<void>;
  signContractByServer: (id: string) => Promise<any>;
}

export const useContractStore = create<ContractState>((set, get) => ({
  contracts: [],
  currentContract: null,
  loading: false,
  error: null,

  fetchContracts: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/contracts');
      set({ contracts: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Lỗi tải danh sách hợp đồng', loading: false });
    }
  },

  fetchContractById: async (id: string) => {
    set({ loading: true, error: null, currentContract: null });
    try {
      const res = await api.get(`/contracts/${id}`);
      set({ currentContract: res.data.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Lỗi tải hợp đồng', loading: false });
    }
  },

  createContract: async (data: any) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/contracts', data);
      const newContract = res.data.data;
      set((state) => ({
        contracts: [newContract, ...state.contracts],
        loading: false
      }));
      return newContract;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Lỗi tạo hợp đồng', loading: false });
      return null;
    }
  },

  generatePreview: async (id: string) => {
    try {
      const res = await api.post(`/contracts/${id}/preview`);
      // Update current contract with new hash/CID
      const current = get().currentContract;
      if (current && current._id === id) {
        set({
          currentContract: {
            ...current,
            documentHash: res.data.data.documentHash,
            ipfsCid: res.data.data.ipfsCid
          }
        });
      }
      return res.data.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Lỗi sinh PDF';
      set({ error: errMsg });
      throw new Error(errMsg);
    }
  },

  deployOnChain: async (id: string, clientAddress?: string) => {
    try {
      const res = await api.post(`/contracts/${id}/deploy`, { clientAddress });
      const current = get().currentContract;
      if (current && current._id === id) {
        set({
          currentContract: {
            ...current,
            txHash: res.data.data.txHash,
            smartContractAddress: res.data.data.smartContractAddress,
            status: 'created'
          }
        });
      }
      return res.data.data;
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Lỗi ghi Blockchain';
      set({ error: errMsg });
      throw new Error(errMsg);
    }
  },

  signContract: async (id: string, party: string, signature: string, txHash: string) => {
    try {
      const res = await api.patch(`/contracts/${id}/sign`, { party, signature, txHash });
      const current = get().currentContract;
      if (current && current._id === id) {
        // Merge response fields into existing contract (backend returns partial object)
        set({
          currentContract: {
            ...current,
            ...res.data.data,
            // Preserve nested objects that backend doesn't return
            customer: res.data.data.customer || current.customer,
            employee: res.data.data.employee || current.employee,
            terms: res.data.data.terms || current.terms,
            chiTietHopDong: res.data.data.chiTietHopDong || current.chiTietHopDong,
          }
        });
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Lỗi ký hợp đồng' });
    }
  },

  signContractByServer: async (id: string) => {
    try {
      const res = await api.post(`/contracts/${id}/sign-by-server`);
      const current = get().currentContract;
      if (current && current._id === id) {
        set({
          currentContract: {
            ...current,
            ...res.data.data,
            customer: res.data.data.customer || current.customer,
            employee: res.data.data.employee || current.employee,
            terms: res.data.data.terms || current.terms,
            chiTietHopDong: res.data.data.chiTietHopDong || current.chiTietHopDong,
          }
        });
      }
      return res.data.data;
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Lỗi ký hợp đồng bằng server' });
      throw err;
    }
  }
}));
