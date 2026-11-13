export const PLATFORM_PRIVACY_VERSION = '2026-03-13-b'
export const PLATFORM_PRIVACY_PATH = '/privacidad'
export const PLATFORM_PRIVACY_DELETE_HASH = 'eliminar-cuenta'

export const PLATFORM_PRIVACY_SECTIONS = [
  {
    title: '1. Responsable y alcance',
    blocks: [
      {
        type: 'p',
        text: 'Esta Política de Privacidad describe cómo Palajaba trata los datos personales de clientes, proveedores y demás usuarios de la plataforma. Al crear una cuenta, utilizar la plataforma o realizar una compra, el usuario declara haber leído esta política.',
      },
      {
        type: 'p',
        text: 'El tratamiento de datos personales se rige por esta Política de Privacidad y, en lo que corresponda, por los Términos y Condiciones de Palajaba.',
      },
    ],
  },
  {
    title: '2. Datos que podemos tratar',
    blocks: [
      {
        type: 'p',
        text: 'Según el uso de la plataforma, Palajaba podrá tratar:',
      },
      {
        type: 'ul',
        items: [
          'Identidad y datos de contacto: nombre, correo, teléfono, documento de identidad y datos de la tienda o del perfil.',
          'Datos de cuenta y autenticación: credenciales, códigos de verificación y registros de acceso.',
          'Datos de pedidos y operaciones: productos, cantidades, importes, costes de envío, cargos de servicio, fechas, estados, direcciones, comunicaciones, evidencias, pagos, reembolsos y pagos a proveedores.',
          'Datos técnicos y de dispositivo: información necesaria para el funcionamiento de la app o del sitio, notificaciones y seguridad.',
          'Datos de ubicación, cuando el usuario los facilite o autorice para delimitar zonas de compra o entrega.',
        ],
      },
    ],
  },
  {
    title: '3. Finalidades del tratamiento',
    blocks: [
      {
        type: 'p',
        text: 'Palajaba trata los datos personales para:',
      },
      {
        type: 'ul',
        items: [
          'Crear y gestionar cuentas de clientes y proveedores.',
          'Procesar pedidos, pagos, entregas, incidencias y reembolsos.',
          'Mantener la integridad de la plataforma y el historial comercial.',
          'Atender reclamaciones, soporte y comunicaciones operativas.',
          'Elaborar estadísticas y mejorar el servicio.',
          'Cumplir obligaciones legales, de seguridad y de prevención del fraude.',
          'Enviar avisos relacionados con la cuenta, el pedido o la suscripción cuando resulte necesario.',
        ],
      },
    ],
  },
  {
    title: '4. Conservación de datos e historial de operaciones',
    blocks: [
      {
        type: 'p',
        text: 'Palajaba conservará los registros de pedidos y operaciones durante el tiempo necesario para mantener la integridad de la plataforma, permitir consultas históricas, elaborar estadísticas, atender reclamaciones y cumplir obligaciones legales.',
      },
      {
        type: 'p',
        text: 'Los registros podrán incluir identidades y datos de contacto de las partes, productos, cantidades, importes, costes de envío, cargos de servicio, fechas, estados, comunicaciones, evidencias, pagos, reembolsos y pagos a proveedores. La suspensión, inactividad o cierre de una cuenta no supondrá la eliminación automática del historial comercial.',
      },
      {
        type: 'p',
        text: 'Cuando determinados datos personales dejen de ser necesarios, Palajaba podrá anonimizar, seudonimizar o restringir su acceso, siempre que ello no comprometa obligaciones legales, trazabilidad de operaciones ni conservación legítima de estadísticas históricas.',
      },
    ],
  },
  {
    title: '5. Encargados y terceros',
    blocks: [
      {
        type: 'p',
        text: 'Palajaba puede compartir datos con proveedores que intervienen en el abastecimiento, preparación o envío de pedidos, y con prestadores de pagos, comunicaciones, alojamiento u otros servicios técnicos necesarios para operar la plataforma.',
      },
      {
        type: 'p',
        text: 'Estos terceros solo deben tratar los datos para las finalidades encargadas y conforme a sus propios términos cuando resulten aplicables. La utilización de terceros no exime a Palajaba de las obligaciones que legalmente le correspondan frente al usuario.',
      },
    ],
  },
  {
    title: '6. Seguridad',
    blocks: [
      {
        type: 'p',
        text: 'Palajaba aplica medidas razonables de seguridad técnica y organizativa para proteger los datos personales frente a accesos no autorizados, pérdida o uso indebido. Ningún sistema es completamente infalible; si detectas un incidente, contacta al soporte de Palajaba.',
      },
    ],
  },
  {
    title: '7. Derechos del usuario',
    blocks: [
      {
        type: 'p',
        text: 'Según la legislación aplicable, el usuario podrá solicitar acceso, rectificación, actualización, limitación u oposición al tratamiento de sus datos personales, así como la información necesaria sobre su uso. Algunas solicitudes pueden estar limitadas cuando existan obligaciones de conservación, trazabilidad comercial o requisitos legales.',
      },
      {
        type: 'p',
        text: 'Para ejercer estos derechos o plantear dudas sobre privacidad, el usuario puede contactar al soporte de Palajaba a través de los canales publicados en la plataforma.',
      },
    ],
  },
  {
    title: '8. Eliminación de cuenta',
    anchor: 'eliminar-cuenta',
    blocks: [
      {
        type: 'p',
        text: 'Si creaste una cuenta en Palajaba, puedes solicitar la eliminación de tu cuenta y de los datos asociados. En la aplicación, el cliente puede hacerlo desde Perfil y la tienda desde Cuenta (nombre, teléfono y correo). También puedes solicitarlo contactando al soporte de Palajaba a través de los canales publicados en la plataforma, sin necesidad de reinstalar la app.',
      },
      {
        type: 'p',
        text: 'Al eliminar una cuenta de cliente, Palajaba borra de forma permanente el perfil, direcciones, favoritos, credenciales, métodos de pago guardados en la cuenta, notificaciones y dispositivos vinculados. No se eliminan los pedidos ya registrados: las tiendas conservan el historial operativo del pedido (productos, importes, estados y datos de contacto capturados en el momento de la compra) para cumplimiento, entregas, reclamaciones y obligaciones legales.',
      },
      {
        type: 'p',
        text: 'Al eliminar una cuenta de tienda, Palajaba borra de forma permanente el registro de la tienda, el catálogo, gestores, avisos y datos de acceso. No se eliminan los pedidos ya registrados: los clientes conservan su historial con el nombre de la tienda y el detalle del pedido capturado en la compra.',
      },
      {
        type: 'p',
        text: 'La eliminación podrá rechazarse temporalmente mientras existan pedidos pendientes de confirmación, pagos en curso o disputas abiertas. Cuando proceda, se informará al usuario para que regularice esas operaciones antes de borrar la cuenta.',
      },
    ],
  },
  {
    title: '9. Modificaciones',
    blocks: [
      {
        type: 'p',
        text: 'Palajaba podrá actualizar esta Política de Privacidad por razones operativas, tecnológicas o legales. Las modificaciones podrán publicarse en el sitio web, dentro de la plataforma o mediante otros canales oficiales y entrarán en vigor desde la fecha indicada.',
      },
      {
        type: 'p',
        text: 'El usuario es responsable de consultar la versión vigente. El uso continuado de la plataforma tras la publicación de cambios podrá constituir aceptación cuando la ley lo permita.',
      },
    ],
  },
]
