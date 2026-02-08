
import { supabase } from './supabaseClient';
import { Invoice, Client, Product, InvoiceStatus, Payment, Company } from "../types";

export const db = {
    // --- Company Settings ---
    getCompanySettings: async (): Promise<Company | null> => {
        const { data, error } = await supabase
            .from('company_settings')
            .select('id, name, address, email, phone, siret, logo, city, country, footer, signature, icons, remarques, invoice_prefix, invoice_start_number')
            .limit(1)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    updateCompanySettings: async (company: Company): Promise<void> => {
        const { id, ...updates } = company;

        const { data } = await supabase.from('company_settings').select('id').limit(1).maybeSingle();

        if (data) {
            const { error } = await supabase
                .from('company_settings')
                .update(updates)
                .eq('id', data.id);
            if (error) throw error;
        } else {
            const { error } = await supabase
                .from('company_settings')
                .insert([updates]);
            if (error) throw error;
        }
    },

    // --- Clients ---
    getClients: async (): Promise<Client[]> => {
        let allClients: any[] = [];
        let from = 0;
        let to = 999;
        let finished = false;

        while (!finished) {
            const { data, error } = await supabase
                .from('customers')
                .select('id, name, manager, location, city, region, address, gsm1, gsm2, phone, email, gamme, user_email, is_blocked, created_at, ice')
                .order('name', { ascending: true })
                .range(from, to);

            if (error) throw error;

            if (data && data.length > 0) {
                allClients = [...allClients, ...data];
                if (data.length < 1000) {
                    finished = true;
                } else {
                    from += 1000;
                    to += 1000;
                }
            } else {
                finished = true;
            }
        }

        return allClients.map(c => ({
            ...c,
            balance: 0
        }));
    },

    addClient: async (client: Client): Promise<Client> => {
        const { id, balance, ...clientToInsert } = client;
        const { data, error } = await supabase
            .from('customers')
            .insert([clientToInsert])
            .select('id, name, manager, location, city, region, address, gsm1, gsm2, phone, email, gamme, user_email, is_blocked, created_at, ice')
            .single();

        if (error) throw error;
        return { ...data, balance: 0 };
    },

    updateClient: async (client: Client): Promise<Client> => {
        const { id, balance, created_at, ...updates } = client;
        const { data, error } = await supabase
            .from('customers')
            .update(updates)
            .eq('id', id)
            .select('id, name, manager, location, city, region, address, gsm1, gsm2, phone, email, gamme, user_email, is_blocked, created_at, ice')
            .single();

        if (error) throw error;
        return { ...data, balance: 0 };
    },

    deleteClient: async (id: string): Promise<void> => {
        const { error } = await supabase
            .from('customers')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    // --- Products ---
    getProducts: async (): Promise<Product[]> => {
        const { data, error } = await supabase
            .from('products')
            .select('id, name, description, price, unit')
            .order('name', { ascending: true });

        if (error) throw error;
        return data || [];
    },

    addProduct: async (product: Product): Promise<Product> => {
        const { id, ...prodToInsert } = product;
        const { data, error } = await supabase
            .from('products')
            .insert([prodToInsert])
            .select('id, name, description, price, unit')
            .single();

        if (error) throw error;
        return data;
    },

    // --- Invoices ---
    getInvoices: async (): Promise<Invoice[]> => {
        const { data, error } = await supabase
            .from('invoices')
            .select(`
        id, number, date, due_date, po_number, customer_id, status, notes, subtotal, tva_total, discount_amount, adjustment_amount, grand_total,
        invoice_items (id, product_id, product_name, quantity, price, tva_rate, discount),
        payments (id, invoice_id, amount, date, method, check_image, note)
      `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return (data || []).map(inv => ({
            id: inv.id,
            number: inv.number,
            date: inv.date,
            dueDate: inv.due_date,
            poNumber: inv.po_number,
            clientId: inv.customer_id,
            status: inv.status as InvoiceStatus,
            notes: inv.notes,
            subtotal: parseFloat(inv.subtotal),
            tvaTotal: parseFloat(inv.tva_total),
            taxEnabled: true,
            discountAmount: parseFloat(inv.discount_amount || 0),
            adjustmentAmount: parseFloat(inv.adjustment_amount || 0),
            grandTotal: parseFloat(inv.grand_total),
            items: (inv.invoice_items || []).map((item: any) => ({
                id: item.id,
                productId: item.product_id,
                productName: item.product_name,
                quantity: parseFloat(item.quantity),
                price: parseFloat(item.price),
                tvaRate: parseFloat(item.tva_rate),
                discount: parseFloat(item.discount)
            })),
            payments: (inv.payments || []).map((p: any) => ({
                id: p.id,
                invoiceId: p.invoice_id,
                amount: parseFloat(p.amount),
                date: p.date,
                method: p.method,
                checkImage: p.check_image,
                note: p.note
            }))
        }));
    },

    addInvoice: async (invoice: Invoice): Promise<Invoice> => {
        const { data: invData, error: invError } = await supabase
            .from('invoices')
            .insert([{
                number: invoice.number,
                date: invoice.date,
                due_date: invoice.dueDate,
                po_number: invoice.poNumber,
                customer_id: invoice.clientId,
                status: invoice.status,
                notes: invoice.notes,
                subtotal: invoice.subtotal,
                tva_total: invoice.tvaTotal,
                discount_amount: invoice.discountAmount,
                adjustment_amount: invoice.adjustmentAmount,
                grand_total: invoice.grandTotal
            }])
            .select('id')
            .single();

        if (invError) throw invError;

        const itemsToInsert = invoice.items.map(item => ({
            invoice_id: invData.id,
            product_id: item.productId,
            // Fix: item.product_name -> item.productName
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            // Fix: item.tva_rate -> item.tvaRate
            tva_rate: item.tvaRate,
            discount: item.discount
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        return { ...invoice, id: invData.id };
    },

    updateInvoice: async (invoice: Invoice): Promise<Invoice> => {
        const { error: invError } = await supabase
            .from('invoices')
            .update({
                number: invoice.number,
                date: invoice.date,
                due_date: invoice.dueDate,
                po_number: invoice.poNumber,
                customer_id: invoice.clientId,
                status: invoice.status,
                notes: invoice.notes,
                subtotal: invoice.subtotal,
                tva_total: invoice.tvaTotal,
                discount_amount: invoice.discountAmount || 0,
                adjustment_amount: invoice.adjustmentAmount || 0,
                grand_total: invoice.grandTotal
            })
            .eq('id', invoice.id);

        if (invError) throw invError;
        await supabase.from('invoice_items').delete().eq('invoice_id', invoice.id);

        const itemsToInsert = invoice.items.map(item => ({
            invoice_id: invoice.id,
            product_id: item.productId,
            // Fix: item.product_name -> item.productName
            product_name: item.productName,
            quantity: item.quantity,
            price: item.price,
            // Fix: item.tva_rate -> item.tvaRate
            tva_rate: item.tvaRate,
            discount: item.discount
        }));

        const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);
        if (itemsError) throw itemsError;

        return invoice;
    },

    deleteInvoice: async (id: string): Promise<void> => {
        await supabase.from('invoice_items').delete().eq('invoice_id', id);
        await supabase.from('payments').delete().eq('invoice_id', id);
        const { error } = await supabase.from('invoices').delete().eq('id', id);
        if (error) throw error;
    },

    addPayment: async (invoiceId: string, payment: Payment) => {
        const { error: payError } = await supabase
            .from('payments')
            .insert([{
                invoice_id: invoiceId,
                amount: payment.amount,
                date: payment.date,
                method: payment.method,
                // Fix: payment.check_image -> payment.checkImage
                check_image: payment.checkImage,
                note: payment.note
            }]);

        if (payError) throw payError;
        await db.recalculateInvoiceStatus(invoiceId);
    },

    deletePayment: async (invoiceId: string, paymentId: string) => {
        const { error: payError } = await supabase
            .from('payments')
            .delete()
            .eq('id', paymentId);

        if (payError) throw payError;
        await db.recalculateInvoiceStatus(invoiceId);
    },

    recalculateInvoiceStatus: async (invoiceId: string) => {
        const { data: inv } = await supabase.from('invoices').select('grand_total').eq('id', invoiceId).single();
        const { data: pays } = await supabase.from('payments').select('amount').eq('invoice_id', invoiceId);

        const totalPaid = (pays || []).reduce((sum, p) => sum + parseFloat(p.amount), 0);
        const grandTotal = parseFloat(inv.grand_total);

        let newStatus = InvoiceStatus.SENT;
        if (totalPaid >= grandTotal) {
            newStatus = InvoiceStatus.PAID;
        } else if (totalPaid > 0) {
            newStatus = InvoiceStatus.PARTIAL;
        } else {
            newStatus = InvoiceStatus.DRAFT;
        }

        await supabase.from('invoices').update({ status: newStatus }).eq('id', invoiceId);
    }
};
