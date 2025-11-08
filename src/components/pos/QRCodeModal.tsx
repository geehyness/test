// src/components/pos/QRCodeModal.tsx
'use client';

import { 
    Modal, 
    ModalOverlay, 
    ModalContent, 
    ModalHeader, 
    ModalCloseButton, 
    ModalBody, 
    Image, 
    Center, 
    Button, 
    ModalFooter,
    Text,
    VStack
} from '@chakra-ui/react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: { id: string; name: string } | null;
  shopId: string | null;
  tenantDomain: string | null;
}

export default function QRCodeModal({ isOpen, onClose, table, shopId, tenantDomain }: QRCodeModalProps) {
    if (!table || !shopId || !tenantDomain) return null;

    const url = `${window.location.origin}/customer-menu/${tenantDomain}?shop_id=${shopId}&table_id=${table.id}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow?.document.write(`
          <html>
            <head><title>Print QR Code for ${table.name}</title></head>
            <body style="text-align: center; margin-top: 50px; font-family: sans-serif;">
              <h2>Table: ${table.name}</h2>
              <p>Scan to view menu and order</p>
              <img src="${qrCodeUrl}" alt="QR Code for table ${table.name}" />
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow?.document.close();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>QR Code for {table.name}</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <Center>
                            <Image src={qrCodeUrl} alt={`QR Code for ${table.name}`} boxSize="250px" />
                        </Center>
                        <Text fontSize="sm" color="gray.600" textAlign="center">
                            Scan this code to view the menu and order directly from this table.
                        </Text>
                    </VStack>
                </ModalBody>
                <ModalFooter>
                    <Button onClick={onClose} variant="outline" mr={3}>Close</Button>
                    <Button onClick={handlePrint} colorScheme="blue">Print</Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}