"use client"

import { useRef } from "react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import type { Order } from "@/types/order"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

interface PrintTicketProps {
  order: Order
  onPrintStarted?: () => void
  closeDialog?: () => void // Nuevo prop para cerrar el diálogo directamente
}

export function PrintTicket({ order, onPrintStarted, closeDialog }: PrintTicketProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    // Cerrar el diálogo inmediatamente al hacer clic
    if (closeDialog) {
      console.log("Cerrando diálogo desde PrintTicket")
      closeDialog()
    }

    const content = printRef.current
    if (!content) return

    const printWindow = window.open("", "_blank")
    if (!printWindow) return

    // Create print content
    const html = `
      <html>
        <head>
          <title>Ticket de Pedido #${order.id}</title>
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              width: 80mm; /* Standard receipt width */
            }
            .ticket {
              padding: 10px;
            }
            .header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .title {
              font-size: 18px;
              font-weight: bold;
              margin: 5px 0;
            }
            .subtitle {
              font-size: 14px;
              margin: 5px 0;
            }
            .info {
              margin: 10px 0;
              font-size: 12px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin: 3px 0;
            }
            .items {
              margin: 10px 0;
              border-bottom: 1px dashed #000;
              padding-bottom: 10px;
            }
            .item {
              margin: 5px 0;
              font-size: 12px;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
            }
            .total {
              font-weight: bold;
              font-size: 14px;
              text-align: right;
              margin: 10px 0;
            }
            .footer {
              text-align: center;
              font-size: 12px;
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            @media print {
              body {
                width: 80mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="ticket">
            <div class="header">
              <div class="title">LA PECOSA</div>
              <div class="subtitle">Rotisería</div>
              <div class="subtitle">Ticket de Pedido #${order.id}</div>
            </div>
            
            <div class="info">
              <div class="info-row">
                <span>Cliente:</span>
                <span>${order.customer}</span>
              </div>
              <div class="info-row">
                <span>Fecha:</span>
                <span>${format(new Date(order.created_at), "dd/MM/yyyy", { locale: es })}</span>
              </div>
              <div class="info-row">
                <span>Hora:</span>
                <span>${format(new Date(order.created_at), "HH:mm", { locale: es })}</span>
              </div>
              ${
                order.delivery_method
                  ? `
              <div class="info-row">
                <span>Tipo de entrega:</span>
                <span>${order.delivery_method === "envio" ? "Envío a domicilio" : "Retiro en local"}</span>
              </div>
              `
                  : ""
              }
              ${
                order.delivery_address
                  ? `
              <div class="info-row">
                <span>Dirección:</span>
                <span>${order.delivery_address}</span>
              </div>
              `
                  : ""
              }
              ${
                order.pickup_date_time
                  ? `
              <div class="info-row">
                <span>Fecha/hora de entrega:</span>
                <span>${format(new Date(order.pickup_date_time), "dd/MM/yyyy HH:mm", { locale: es })}</span>
              </div>
              `
                  : ""
              }
            </div>
            
            <div class="items">
              <div class="subtitle">Detalle del pedido:</div>
              ${
                Array.isArray(order.items)
                  ? order.items
                      .map(
                        (item) => `
                <div class="item">
                  <div class="item-row">
                    <span>${item.quantity}x ${item.productName || "Producto"}</span>
                    <span>$${
                      item.is_by_weight || item.format_sales === "Por KG"
                        ? `${item.basePrice}/kg`
                        : (item.basePrice * item.quantity).toFixed(2)
                    }</span>
                  </div>
                  ${item.notes ? `<div>Nota: ${item.notes}</div>` : ""}
                  ${
                    item.removedIngredients && item.removedIngredients.length > 0
                      ? `<div>Sin: ${item.removedIngredients.join(", ")}</div>`
                      : ""
                  }
                </div>
              `,
                      )
                      .join("")
                  : "<div>No hay productos en este pedido.</div>"
              }
            </div>
            
            <div class="total">
              <div class="info-row">
                <span>TOTAL:</span>
                <span>$${order.total.toFixed(2)}</span>
              </div>
              ${
                order.payment_method
                  ? `
              <div class="info-row">
                <span>Método de pago:</span>
                <span>${order.payment_method === "efectivo" ? "Efectivo" : "Débito"}</span>
              </div>
              `
                  : ""
              }
              ${
                order.cash_amount
                  ? `
              <div class="info-row">
                <span>Pago con:</span>
                <span>$${order.cash_amount.toFixed(2)}</span>
              </div>
              <div class="info-row">
                <span>Vuelto:</span>
                <span>$${(order.cash_amount - order.total).toFixed(2)}</span>
              </div>
              `
                  : ""
              }
            </div>
            
            <div class="footer">
              <div>¡Gracias por su compra!</div>
              <div>La Pecosa Rotisería</div>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()

    // Notificar que la impresión ha comenzado
    if (onPrintStarted) {
      console.log("Llamando a onPrintStarted")
      onPrintStarted()
    }

    // Wait for content to load before printing
    printWindow.onload = () => {
      printWindow.print()
      // Close the window after print dialog is closed (optional)
      // printWindow.onafterprint = () => printWindow.close()
    }
  }

  return (
    <div>
      <div className="hidden" ref={printRef}>
        {/* Hidden content for reference */}
      </div>
      <Button onClick={handlePrint} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white">
        <Printer className="h-4 w-4" />
        Imprimir Ticket
      </Button>
    </div>
  )
}

