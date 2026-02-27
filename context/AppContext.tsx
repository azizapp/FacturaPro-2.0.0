
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Invoice, Client, Product, Company, Payment, InvoiceStatus, User } from '../types';
import { db } from '../services/supabaseService';
import { dataSyncService } from '../services/dataSyncService';
import { supabase } from '../services/supabaseClient';

interface AppContextType {
    invoices: Invoice[];
    clients: Client[];
    products: Product[];
    company: Company | null;
    isLoading: boolean;
    theme: 'light' | 'dark';
    user: User | null;
    toggleTheme: () => void;
    logout: () => void;
    refreshUserData: () => Promise<void>;
    setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    setCompany: React.Dispatch<React.SetStateAction<Company | null>>;
    addInvoice: (invoice: Invoice) => void;
    updateInvoice: (invoice: Invoice) => void;
    deleteInvoice: (id: string) => void;
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    deleteClient: (id: string) => void;
    addProduct: (product: Product) => void;
    updateProduct: (product: Product) => void;
    deleteProduct: (id: string) => void;
    updateCompany: (company: Company) => void;
    addPayment: (invoiceId: string, payment: Payment) => void;
    deletePayment: (invoiceId: string, paymentId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [user, setUser] = useState<User | null>(null);

    // Initialisation immédiate au montage
    useEffect(() => {
        const init = async () => {
            // Charger le thème
            const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
            if (savedTheme) {
                setTheme(savedTheme);
                document.documentElement.classList.toggle('dark', savedTheme === 'dark');
            }

            // Charger les données du cache immédiatement pour un affichage instantané
            const cachedData = dataSyncService.getCachedData();
            if (cachedData.invoices.length > 0 || cachedData.clients.length > 0 || cachedData.products.length > 0) {
                setInvoices(cachedData.invoices);
                setClients(cachedData.clients);
                setProducts(cachedData.products);
                if (cachedData.company) setCompany(cachedData.company);
                // Si on a des données, on peut déjà arrêter l'affichage du spinner principal
                setIsLoading(false);
            }

            // Vérifier la session Supabase existante
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email! });
                await refreshUserData(); // Sync fraîche avec le serveur
            } else {
                setIsLoading(false);
            }
        };

        init();

        // Écouter les changements d'état d'authentification
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setUser({ id: session.user.id, email: session.user.email! });
                refreshUserData();
            } else {
                setUser(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const refreshUserData = async () => {
        // On n'affiche le loader que si on n'a absolument rien à afficher
        if (invoices.length === 0 && clients.length === 0) {
            setIsLoading(true);
        }
        
        try {
            // Synchronisation en arrière-plan via le service de sync
            const freshData = await dataSyncService.initializeWithCache();
            setInvoices(freshData.invoices);
            setClients(freshData.clients);
            setProducts(freshData.products);
            
            if (freshData.company) {
                setCompany(freshData.company);
                if (freshData.company.app_icon) {
                    localStorage.setItem('app_icon', freshData.company.app_icon);
                }
            } else if (!company) {
                setCompany({
                    id: '1', name: 'Ma Société', address: '123 Rue de la Paix',
                    email: 'contact@example.com', phone: '0123456789', siret: '12345678901234',
                    city: 'Paris', country: 'France'
                });
            }
        } catch (error) {
            console.error("Erreur lors du rafraîchissement des données:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const addInvoice = (invoice: Invoice) => {
        setInvoices(prev => [invoice, ...prev]);
        db.addInvoice(invoice).catch(e => console.error("Erreur de synchro facture:", e));
        dataSyncService.addInvoice(invoice);
    };

    const updateInvoice = (invoice: Invoice) => {
        setInvoices(prev => prev.map(inv => inv.id === invoice.id ? invoice : inv));
        db.updateInvoice(invoice).catch(e => console.error("Erreur de mise à jour facture:", e));
        dataSyncService.updateInvoices([...invoices.filter(i => i.id !== invoice.id), invoice]);
    };

    const deleteInvoice = (id: string) => {
        setInvoices(prev => prev.filter(inv => inv.id !== id));
        db.deleteInvoice(id).catch(e => console.error("Erreur de suppression facture:", e));
        dataSyncService.deleteInvoice(id);
    };

    const addClient = (client: Client) => {
        setClients(prev => [...prev, client]);
        db.addClient(client).catch(e => console.error("Erreur de synchro client:", e));
        dataSyncService.addClient(client);
    };

    const updateClient = (client: Client) => {
        setClients(prev => prev.map(c => c.id === client.id ? client : c));
        db.updateClient(client).catch(e => console.error("Erreur de mise à jour client:", e));
    };

    const deleteClient = (id: string) => {
        setClients(prev => prev.filter(c => c.id !== id));
        db.deleteClient(id).catch(e => console.error("Erreur de suppression client:", e));
        dataSyncService.deleteClient(id);
    };

    const addProduct = (product: Product) => {
        setProducts(prev => [...prev, product]);
        db.addProduct(product).catch(e => console.error("Erreur de synchro produit:", e));
        dataSyncService.addProduct(product);
    };

    const updateProduct = (product: Product) => {
        setProducts(prev => prev.map(p => p.id === product.id ? product : p));
        db.updateProduct(product).catch(e => console.error("Erreur de mise à jour produit:", e));
        dataSyncService.updateProducts([...products.filter(p => p.id !== product.id), product]);
    };

    const deleteProduct = (id: string) => {
        setProducts(prev => prev.filter(p => p.id !== id));
        db.deleteProduct(id).catch(e => console.error("Erreur de suppression produit:", e));
        dataSyncService.deleteProduct(id);
    };

    const updateCompany = (newCompany: Company) => {
        setCompany(newCompany);
        if (newCompany.app_icon) {
            localStorage.setItem('app_icon', newCompany.app_icon);
        } else {
            localStorage.removeItem('app_icon');
        }
        // Utiliser une version simplifiée de mise à jour pour éviter les problèmes de RLS si l'ID n'est pas bon
        db.updateCompanySettings(newCompany).catch(e => {
            console.error("Erreur de synchro paramètres:", e);
            // Optionnel : Alerter l'utilisateur de l'erreur RLS
            if (e.code === '42501') {
                alert("Erreur de permission : Impossible de modifier les paramètres de l'entreprise. Vérifiez vos accès Supabase.");
            }
        });
        dataSyncService.updateCompany(newCompany);
    };

    const addPayment = (invoiceId: string, payment: Payment) => {
        setInvoices(prev => prev.map(inv => {
            if (inv.id === invoiceId) {
                const updatedPayments = [...(inv.payments || []), payment];
                const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
                let newStatus = inv.status;
                if (totalPaid >= inv.grandTotal) newStatus = InvoiceStatus.PAID;
                else if (totalPaid > 0) newStatus = InvoiceStatus.PARTIAL;
                return { ...inv, payments: updatedPayments, status: newStatus };
            }
            return inv;
        }));
        db.addPayment(invoiceId, payment).catch(e => console.error("Erreur de synchro paiement:", e));
    };

    const deletePayment = (invoiceId: string, paymentId: string) => {
        setInvoices(prev => {
            return prev.map(inv => {
                if (inv.id === invoiceId) {
                    const updatedPayments = (inv.payments || []).filter(p => p.id !== paymentId);
                    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
                    let newStatus = inv.status;
                    if (totalPaid >= inv.grandTotal) newStatus = InvoiceStatus.PAID;
                    else if (totalPaid > 0) newStatus = InvoiceStatus.PARTIAL;
                    else newStatus = InvoiceStatus.SENT;
                    return { ...inv, payments: updatedPayments, status: newStatus };
                }
                return inv;
            });
        });
        db.deletePayment(invoiceId, paymentId).catch(e => console.error("Erreur de suppression paiement:", e));
    };

    return (
        <AppContext.Provider value={{
            invoices, clients, products, company, isLoading, theme, user, toggleTheme, logout, refreshUserData,
            setInvoices, setClients, setProducts, setCompany,
            addInvoice, updateInvoice, deleteInvoice,
            addClient, updateClient, deleteClient,
            addProduct, updateProduct, deleteProduct, updateCompany, addPayment, deletePayment
        }}>
            {children}
        </AppContext.Provider>
    );
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
