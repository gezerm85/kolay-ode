'use client';

import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Edit } from 'lucide-react';
import { Customer } from '@/types/customer';
import { CustomerForm } from './CustomerForm';
import { useRouter } from 'next/navigation';

const CustomerRowSkeleton = () => (
  <TableRow>
    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
    <TableCell className="hidden sm:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-28" /></TableCell>
    <TableCell className="text-right"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
  </TableRow>
);

export function CustomersList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const router = useRouter();

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const customersData: Customer[] = [];
      querySnapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching customers: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditClick = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };
  
  const handleAddNewClick = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };
  
  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedCustomer(null);
  };
  
  const handleRowClick = (customer: Customer) => {
      router.push(`/customers/${customer.id}`);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Müşteri Listesi</CardTitle>
              <CardDescription>Tüm kayıtlı müşterileriniz.</CardDescription>
            </div>
            <Button onClick={handleAddNewClick}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Yeni Müşteri Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                  <TableHead className="hidden md:table-cell">Vergi Numarası</TableHead>
                  <TableHead className="text-right">Düzenle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => <CustomerRowSkeleton key={i} />)
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center">
                      Henüz kayıtlı müşteri bulunmuyor.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow key={customer.id} onClick={() => handleRowClick(customer)} className="cursor-pointer">
                      <TableCell className="font-medium">{customer.name}</TableCell>
                      <TableCell className="hidden sm:table-cell">{customer.phone || 'N/A'}</TableCell>
                      <TableCell className="hidden md:table-cell">{customer.taxNumber || 'N/A'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(customer, e)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Düzenle</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{selectedCustomer ? 'Müşteri Bilgilerini Düzenle' : 'Yeni Müşteri Oluştur'}</DialogTitle>
            <DialogDescription>
              {selectedCustomer ? 'Müşteri bilgilerini güncelleyin.' : 'Yeni müşteri için gerekli bilgileri girin.'}
            </DialogDescription>
          </DialogHeader>
          <CustomerForm customer={selectedCustomer} onSuccess={handleFormSuccess} />
        </DialogContent>
      </Dialog>
    </>
  );
}
