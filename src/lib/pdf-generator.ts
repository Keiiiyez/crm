import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function generateExpedientePDF(sale: any, contract: any) {
  try {
    // Crear elemento temporal para renderizar
    const element = document.createElement('div');
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.width = '210mm';
    element.style.padding = '20px';
    element.style.fontSize = '12px';
    element.style.fontFamily = 'Arial, sans-serif';
    element.style.backgroundColor = 'white';

    const clientName = sale.clientName || sale.clientFull?.name || 'Cliente No Identificado';
    const clientDni = sale.clientFull?.dni || sale.dni || sale.clienteDni || 'N/A';
    const operadora = sale.operadorDestino || 'N/A';
    const precio = sale.precioCierre || 0;
    const fecha = new Date(sale.createdAt || sale.fecha);
    const refNumber = `REF-${String(sale.id).padStart(6, '0')}`;
    
    // Datos de gestión (Checklist y Notas)
    const checklist = sale.gestion_checklist || {};
    const notasGestion = sale.gestion_notas || "";

    const clientFull = sale.clientFull || {};
    const phone = clientFull.phone || 'No disponible';
    const email = clientFull.email || 'Sin email registrado';
    const address = clientFull.address || 'No especificada';
    const postalCode = clientFull.postalCode || '---';
    const city = clientFull.city || '---';

    element.innerHTML = `
      <div style="border: 2px solid #1e3a8a; padding: 25px; border-radius: 12px; background: #ffffff;">
        <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f1f5f9; padding-bottom: 15px;">
          <h1 style="font-size: 22px; font-weight: bold; color: #1e3a8a; margin: 0; text-transform: uppercase;">Expediente de Venta Oficial</h1>
          <p style="font-size: 11px; color: #64748b; margin: 5px 0 0 0; letter-spacing: 3px; font-weight: bold;">${refNumber}</p>
        </div>

        <div style="display: flex; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
          <div>
            <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase;">Fecha de Emisión</p>
            <p style="font-size: 12px; color: #1e293b; font-weight: bold; margin: 0;">${fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase;">Estado de Operación</p>
            <p style="font-size: 12px; color: #0369a1; font-weight: bold; margin: 0;">${(sale.status || 'PENDIENTE').toUpperCase()}</p>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 11px; font-weight: 900; color: #1e3a8a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #1e3a8a; padding-left: 10px;">Información del Titular</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="grid-column: 1 / -1; background: #f1f5f9; padding: 10px; border-radius: 6px;">
              <span style="font-size: 8px; color: #64748b; font-weight: bold; display: block; margin-bottom: 2px;">TITULAR</span>
              <span style="font-size: 12px; font-weight: bold; color: #0f172a;">${clientName.toUpperCase()}</span>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
              <span style="font-size: 8px; color: #64748b; font-weight: bold; display: block; margin-bottom: 2px;">DNI / NIE</span>
              <span style="font-size: 11px; font-weight: bold;">${clientDni}</span>
            </div>
            <div style="background: #f1f5f9; padding: 10px; border-radius: 6px;">
              <span style="font-size: 8px; color: #64748b; font-weight: bold; display: block; margin-bottom: 2px;">CONTACTO</span>
              <span style="font-size: 11px; font-weight: bold;">${phone}</span>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 25px;">
          <h2 style="font-size: 11px; font-weight: 900; color: #1e3a8a; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; border-left: 4px solid #06b6d4; padding-left: 10px;">Estado de Activación de Servicios</h2>
          
          <div style="border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden;">
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead style="background: #f8fafc; border-bottom: 1px solid #e2e8f0;">
                <tr>
                  <th style="padding: 10px; text-align: left; color: #64748b; font-weight: bold; font-size: 9px;">SERVICIO / PRODUCTO</th>
                  <th style="padding: 10px; text-align: right; color: #64748b; font-weight: bold; font-size: 9px;">ESTADO ACTIVACIÓN</th>
                </tr>
              </thead>
              <tbody>
                ${sale.servicios?.map((s: any, idx: number) => {
                  const status = checklist[`srv_${idx}`] || 'pendiente';
                  const statusColor = status === 'activo' ? '#16a34a' : status === 'cancelado' ? '#dc2626' : '#d97706';
                  const statusBg = status === 'activo' ? '#f0fdf4' : status === 'cancelado' ? '#fef2f2' : '#fffbeb';
                  
                  return `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 12px 10px;">
                        <span style="font-weight: bold; color: #1e293b; display: block;">${s.nombre}</span>
                        ${s.precioBase ? `<span style="font-size: 9px; color: #94a3b8;">Importe base: ${Number(s.precioBase).toFixed(2)}€</span>` : ''}
                      </td>
                      <td style="padding: 12px 10px; text-align: right;">
                        <span style="background: ${statusBg}; color: ${statusColor}; padding: 4px 10px; border-radius: 12px; font-size: 9px; font-weight: 900; text-transform: uppercase; border: 1px solid ${statusColor}44;">
                          ${status}
                        </span>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div style="background: #fafafa; padding: 15px; border-radius: 10px; border: 1px solid #f1f5f9;">
            <h3 style="font-size: 9px; font-weight: bold; color: #64748b; margin: 0 0 8px 0; text-transform: uppercase;">Notas de Seguimiento</h3>
            <p style="font-size: 10px; color: #475569; line-height: 1.5; margin: 0; font-style: italic;">
              ${notasGestion || "Sin incidencias registradas en el seguimiento."}
            </p>
          </div>
          <div style="background: #1e3a8a; padding: 15px; border-radius: 10px; color: white; text-align: center; display: flex; flex-direction: column; justify-content: center;">
            <p style="font-size: 9px; font-weight: bold; margin: 0 0 5px 0; opacity: 0.8; text-transform: uppercase;">Total Cierre de Operación</p>
            <p style="font-size: 24px; font-weight: 900; margin: 0;">${Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
          </div>
        </div>

        <div style="margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <p style="font-size: 8px; color: #94a3b8; margin: 0;">Asesor: ${(sale.usuarioNombre || 'Sistema').toUpperCase()}</p>
            <p style="font-size: 8px; color: #94a3b8; margin: 2px 0 0 0;">ID Operación: ${sale.id}</p>
          </div>
          <div style="text-align: right;">
            <p style="font-size: 8px; color: #94a3b8; margin: 0;">Sello Digital de Validación</p>
            <p style="font-size: 8px; font-family: monospace; color: #cbd5e1; margin: 2px 0 0 0;">${Math.random().toString(36).substring(2, 15).toUpperCase()}</p>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(element);

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(element);

    const imgWidth = 210;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    pdf.save(`Expediente_${refNumber}_${clientName.replace(/\s+/g, '_')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}