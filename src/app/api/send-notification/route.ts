import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      customerName, 
      customerPhone, 
      boatName, 
      guestCount,
      type,
      // Tarih bilgileri
      startDate,
      startHour,
      endHour,
      endDate,
      // Fiyat bilgileri
      basePrice,
      quantity,
      unitLabel,
      totalPrice,
      commissionRate,
      commission,
      captainAmount,
      currency,
      // Kaptan bilgileri
      ownerName, 
      ownerPhone 
    } = body;

    // Para formatla
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: currency || 'TRY' }).format(amount);
    };

    // Tarih/saat detayını oluştur
    let dateDetails = `<p><strong>Tarih:</strong> ${startDate}</p>`;
    if (startHour && endHour) {
      dateDetails = `
        <p><strong>Tarih:</strong> ${startDate}</p>
        <p><strong>Saat Aralığı:</strong> ${startHour} - ${endHour} (${quantity} saat)</p>
      `;
    } else if (endDate) {
      dateDetails = `
        <p><strong>Giriş:</strong> ${startDate}</p>
        <p><strong>Çıkış:</strong> ${endDate}</p>
        <p><strong>Süre:</strong> ${quantity} gece</p>
      `;
    }

    const { data, error } = await resend.emails.send({
      from: 'Acil Talep <onboarding@resend.dev>',
      to: ['a_samet04@hotmail.com'],
      subject: `💰 YENİ TALEP: ${customerName} - ${boatName} (${formatCurrency(totalPrice)})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1e3a5f 0%, #0d2137 100%); color: white; padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0;">💰 Yeni Yat Talebi!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">${boatName}</p>
          </div>

          <div style="background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef;">
            <h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">📋 Müşteri Bilgileri</h2>
            <p><strong>Ad Soyad:</strong> ${customerName}</p>
            <p><strong>Telefon:</strong> <a href="tel:${customerPhone}" style="color: #0066cc;">${customerPhone}</a></p>
            <p><strong>Kişi Sayısı:</strong> ${guestCount || 'Belirtilmedi'}</p>
          </div>

          <div style="background: white; padding: 20px; border: 1px solid #e9ecef; border-top: none;">
            <h2 style="color: #1e3a5f; border-bottom: 2px solid #1e3a5f; padding-bottom: 10px;">⛵ Rezervasyon Detayları</h2>
            <p><strong>Kiralama Türü:</strong> <span style="background: #e3f2fd; padding: 3px 10px; border-radius: 15px;">${type}</span></p>
            ${dateDetails}
          </div>

          <div style="background: #e8f5e9; padding: 20px; border: 1px solid #c8e6c9; border-top: none;">
            <h2 style="color: #2e7d32; border-bottom: 2px solid #2e7d32; padding-bottom: 10px;">💵 Fiyat Detayları</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">Birim Fiyat:</td>
                <td style="text-align: right; padding: 8px 0;">${formatCurrency(basePrice)} / ${unitLabel}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Miktar:</td>
                <td style="text-align: right; padding: 8px 0;">${quantity} ${unitLabel}</td>
              </tr>
              <tr style="border-top: 1px solid #c8e6c9;">
                <td style="padding: 12px 0; font-weight: bold; font-size: 18px;">TOPLAM:</td>
                <td style="text-align: right; padding: 12px 0; font-weight: bold; font-size: 18px; color: #2e7d32;">${formatCurrency(totalPrice)}</td>
              </tr>
            </table>
          </div>

          <div style="background: #fff3e0; padding: 20px; border: 1px solid #ffe0b2; border-top: none;">
            <h2 style="color: #e65100; border-bottom: 2px solid #e65100; padding-bottom: 10px;">📊 Komisyon Hesabı</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0;">Toplam Tutar:</td>
                <td style="text-align: right; padding: 8px 0;">${formatCurrency(totalPrice)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Komisyon Oranı:</td>
                <td style="text-align: right; padding: 8px 0;">%${commissionRate}</td>
              </tr>
              <tr style="background: #ffcc80; font-weight: bold;">
                <td style="padding: 10px 8px;">SENİN KOMİSYONUN:</td>
                <td style="text-align: right; padding: 10px 8px; color: #e65100;">${formatCurrency(commission)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;">Kaptana Gidecek:</td>
                <td style="text-align: right; padding: 8px 0;">${formatCurrency(captainAmount)}</td>
              </tr>
            </table>
          </div>

          <div style="background: #e3f2fd; padding: 20px; border: 1px solid #bbdefb; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1565c0; border-bottom: 2px solid #1565c0; padding-bottom: 10px;">👨‍✈️ Kaptan Bilgileri</h2>
            <p><strong>Kaptan Adı:</strong> ${ownerName || 'Belirtilmemiş'}</p>
            <p><strong>Kaptan Tel:</strong> ${ownerPhone ? `<a href="tel:${ownerPhone}" style="color: #0066cc;">${ownerPhone}</a>` : 'Belirtilmemiş'}</p>
          </div>

          <div style="text-align: center; padding: 20px; color: #666;">
            <p style="font-size: 16px; margin-bottom: 15px;">🚨 <strong>Hemen kaptanı ara ve müşteriye dön!</strong></p>
            ${ownerPhone ? `<a href="tel:${ownerPhone}" style="display: inline-block; background: #1e3a5f; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">📞 Kaptanı Ara</a>` : ''}
          </div>
        </div>
      `
    });

    if (error) return NextResponse.json({ error }, { status: 400 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
