import { formatCurrency } from './formatters';

interface TemplateData {
  orderId: string;
  amount: number;
  currency: string;
  customerName: string;
}

export function replaceTemplates(template: string, data: TemplateData): string {
  return template
    .replace(/{orderId}/g, data.orderId)
    .replace(/{amount}/g, formatCurrency(data.amount, data.currency))
    .replace(/{currency}/g, data.currency)
    .replace(/{customerName}/g, data.customerName);
}
