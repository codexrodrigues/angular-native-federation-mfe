import { Injectable, signal } from '@angular/core';

export interface PayableItem {
  id: number;
  instituicao: string;
  pa: number;
  fornecedor: string;
  documento: string;
  vencimento: string;
  valor: string;
  situacao: string;
  origem: string;
}

const MOCK_DATA: PayableItem[] = [
  {
    id: 13169717,
    instituicao: '4340 - COOP BETA...',
    pa: 19,
    fornecedor: '00000000000000 - FORNECEDOR ALFA...',
    documento: '251201500632',
    vencimento: '22/12/2025',
    valor: '584,24',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  },
  {
    id: 13169666,
    instituicao: '4340 - COOP BETA...',
    pa: 1,
    fornecedor: '00000000000000 - FORNECEDOR ALFA...',
    documento: '251201506699',
    vencimento: '22/12/2025',
    valor: '19,44',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  },
  {
    id: 13169622,
    instituicao: '4340 - COOP BETA...',
    pa: 23,
    fornecedor: '00000000000000 - FORNECEDOR ALFA...',
    documento: '251201502934',
    vencimento: '22/12/2025',
    valor: '583,21',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  },
  {
    id: 13169596,
    instituicao: '4340 - COOP BETA...',
    pa: 7,
    fornecedor: '00000000000000 - FORNECEDOR ALFA...',
    documento: '251201503614',
    vencimento: '22/12/2025',
    valor: '607,18',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  },
  {
    id: 13169565,
    instituicao: '4340 - COOP BETA...',
    pa: 70,
    fornecedor: '00000000000000 - FORNECEDOR ALFA...',
    documento: '251201502801',
    vencimento: '22/12/2025',
    valor: '584,24',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  },
  {
    id: 13169438,
    instituicao: '4340 - COOP BETA...',
    pa: 52,
    fornecedor: '11111111111111 - FORNECEDOR BETA S.A.',
    documento: '251201502934',
    vencimento: '22/12/2025',
    valor: '583,21',
    situacao: 'Em Elaboração',
    origem: 'PRÉ-REGISTRO'
  }
];

@Injectable({
  providedIn: 'root'
})
export class PayablesService {
  private payables = signal<PayableItem[]>([...MOCK_DATA]);
  private nextId = 13169718;

  getAll() {
    return this.payables();
  }

  getById(id: number): PayableItem | undefined {
    return this.payables().find(p => p.id === id);
  }

  create(item: Partial<PayableItem>): PayableItem {
    const newItem: PayableItem = {
      id: this.nextId++,
      instituicao: item.instituicao || '4340 - COOP BETA...',
      pa: item.pa || 1,
      fornecedor: item.fornecedor || '',
      documento: item.documento || '',
      vencimento: item.vencimento || new Date().toLocaleDateString('pt-BR'),
      valor: item.valor || '0,00',
      situacao: item.situacao || 'Em Elaboração',
      origem: item.origem || 'MANUAL'
    };

    this.payables.update(items => [...items, newItem]);
    return newItem;
  }

  update(id: number, item: Partial<PayableItem>): boolean {
    const index = this.payables().findIndex(p => p.id === id);
    if (index === -1) return false;

    this.payables.update(items => {
      const updated = [...items];
      updated[index] = { ...updated[index], ...item };
      return updated;
    });

    return true;
  }

  delete(id: number): boolean {
    const index = this.payables().findIndex(p => p.id === id);
    if (index === -1) return false;

    this.payables.update(items => items.filter(p => p.id !== id));
    return true;
  }
}
