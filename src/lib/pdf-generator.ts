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
    
    // Datos del cliente completo
    const clientFull = sale.clientFull || {};
    const phone = clientFull.phone || 'No disponible';
    const email = clientFull.email || 'Sin email registrado';
    const address = clientFull.address || 'No especificada';
    const postalCode = clientFull.postalCode || '---';
    const city = clientFull.city || '---';

    element.innerHTML = `
      <div style="border: 2px solid #1e3a8a; padding: 20px; border-radius: 8px; background: #f8fafc;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="font-size: 20px; font-weight: bold; color: #1e3a8a; margin: 0;">EXPEDIENTE DE VENTA OFICIAL</h1>
          <p style="font-size: 10px; color: #64748b; margin: 5px 0 0 0; letter-spacing: 2px;">${refNumber}</p>
        </div>

        <div style="background: white; padding: 15px; border-radius: 6px; margin-bottom: 15px; border-left: 4px solid #06b6d4;">
          <p style="font-size: 10px; color: #64748b; font-weight: bold; margin: 0 0 5px 0; letter-spacing: 1px;">DOCUMENTO DIGITALIZADO</p>
          <p style="font-size: 11px; color: #334155; margin: 0;">${fecha.toLocaleDateString('es-ES', { 
            month: 'long', day: 'numeric', year: 'numeric' 
          })} a las ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Información del Titular</h2>
          
          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
            <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">NOMBRE COMPLETO</p>
            <p style="font-size: 13px; font-weight: bold; color: #0f172a; margin: 0;">${clientName.toUpperCase()}</p>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">DNI / NIE</p>
              <p style="font-size: 12px; font-weight: bold; color: #0f172a; margin: 0;">${clientDni}</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">TELÉFONO</p>
              <p style="font-size: 12px; font-weight: bold; color: #0f172a; margin: 0;">${phone}</p>
            </div>
          </div>

          <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
            <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">CORREO ELECTRÓNICO</p>
            <p style="font-size: 12px; font-weight: bold; color: #0f172a; margin: 0;">${email}</p>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Punto de Suministro</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px; grid-column: 1 / -1;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">DIRECCIÓN</p>
              <p style="font-size: 12px; color: #0f172a; margin: 0;">${address}</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">C. POSTAL</p>
              <p style="font-size: 12px; color: #0f172a; margin: 0;">${postalCode}</p>
            </div>
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">LOCALIDAD</p>
              <p style="font-size: 12px; color: #0f172a; margin: 0;">${city}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 12px; font-weight: bold; color: #1e3a8a; margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 1px;">Detalle del Contrato</h2>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div style="background: #f1f5f9; padding: 12px; border-radius: 6px;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">OPERADORA DESTINO</p>
              <p style="font-size: 13px; font-weight: bold; color: #1e40af; margin: 0;">${operadora.toUpperCase()}</p>
            </div>
            <div style="background: #dcfce7; padding: 12px; border-radius: 6px; border-left: 3px solid #16a34a;">
              <p style="font-size: 9px; color: #4b5563; font-weight: bold; margin: 0 0 3px 0; letter-spacing: 0.5px;">IMPORTE CIERRE</p>
              <p style="font-size: 16px; font-weight: bold; color: #15803d; margin: 0;">${Number(precio).toLocaleString('es-ES', { minimumFractionDigits: 2 })} €</p>
            </div>
          </div>

          ${sale.servicios && sale.servicios.length > 0 ? `
            <div style="margin-top: 15px; background: #fafafa; padding: 12px; border-radius: 6px; border-left: 3px solid #3b82f6;">
              <p style="font-size: 9px; color: #64748b; font-weight: bold; margin: 0 0 8px 0; letter-spacing: 0.5px;">SERVICIOS</p>
              ${sale.servicios.map((s: any) => `
                <p style="font-size: 11px; color: #0f172a; margin: 4px 0; padding-left: 12px; border-left: 2px solid #3b82f6;">
                  ${s.nombre || 'Servicio'} ${s.precioBase ? '- ' + Number(s.precioBase).toLocaleString('es-ES', { minimumFractionDigits: 2 }) + ' €' : ''}
                </p>
              `).join('')}
            </div>
          ` : ''}
        </div>

        <div style="border-top: 2px dashed #e2e8f0; padding-top: 15px; text-align: center;">
          <p style="font-size: 9px; color: #94a3b8; margin: 0;">Documento generado automáticamente</p>
        </div>
      </div>
    `;

    document.body.appendChild(element);

    // Convertir a canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    document.body.removeChild(element);

    // Crear PDF
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

    // Descargar
    pdf.save(`Expediente_${refNumber}_${clientName.replace(/\s+/g, '_')}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}
