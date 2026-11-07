import { useLocation } from 'react-router-dom'
import AuthShell from '../auth/components/AuthShell'

const QUESTIONS = [
  {
    title: '¿Cómo pago con QvaPay?',
    answer: 'Al confirmar tu pedido, elige «Pagar por QvaPay». Palajaba te envía una factura con los productos, el domicilio si lo pediste y la tarifa del servicio. La pagas en QvaPay y el dinero queda guardado hasta que confirmes que recibiste el pedido. Si todavía no tienes cuenta, puedes crearla desde el enlace del pie de página.',
  },
  {
    title: '¿Qué pasa después de que hago el pedido?',
    answer: 'Palajaba registra tu compra y el proveedor la prepara. Si pediste domicilio, el proveedor te lo lleva. Cuando está entregado, ves en el pedido una evidencia. Tienes 48 horas para decir si lo recibiste. Si lo confirmas, o si pasan esas horas sin que avises un problema, la compra queda completada.',
  },
  {
    title: '¿Qué es la evidencia de entrega?',
    answer: 'Es el mensaje, y a veces las fotos, con el que el proveedor deja constancia de que te entregó el pedido. Acéptala solo si ya lo tienes. Si no te llegó, recházala enseguida y escríbenos a soporte. No esperes a que pasen las 48 horas: si no respondes, la compra se da por confirmada.',
  },
  {
    title: '¿Me pueden devolver solo una parte?',
    answer: 'Sí. Se pueden quitar unidades de lo que compraste, o devolverte el costo del domicilio. No se agregan productos ni se suben las cantidades. Te avisamos con el motivo y las fotos, y te regresamos el valor de lo que se quitó más la parte de la tarifa de servicio que le correspondía. Lo que sigue en el pedido continúa igual.',
  },
  {
    title: '¿Qué pasa si me devuelven todo?',
    answer: 'Si ya no queda nada del pedido, Palajaba lo cancela y te regresa todo lo que pagaste.',
  },
  {
    title: '¿Qué pasa si algo salió mal y lo reclamo?',
    answer: 'Cuéntanoslo desde el pedido o por soporte. Palajaba revisa lo ocurrido. Si corresponde una devolución, te regresamos esa parte y la porción de la tarifa. Si todavía había algo que sí recibiste, la compra de eso se completa y el pedido se cierra. Si Palajaba confirma que recibiste lo acordado, la compra se completa y no hay devolución.',
  },
]

function returnPath(state) {
  const returnTo = state?.returnTo
  if (typeof returnTo !== 'string' || !returnTo.startsWith('/') || returnTo.startsWith('//')) return ''
  return returnTo
}

export default function PlatformFaq() {
  const returnTo = returnPath(useLocation().state)

  return (
    <AuthShell backTo={returnTo || '/'} backLabel={returnTo ? 'Volver' : 'Inicio'} contentWidth="narrow">
      <article className="pb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-carmelita/70">Palajaba</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-green">Preguntas y respuestas</h1>
        {QUESTIONS.map((item) => (
          <section key={item.title} className="mt-8">
            <h2 className="text-lg font-semibold text-brand-green">{item.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-carmelita">{item.answer}</p>
          </section>
        ))}
      </article>
    </AuthShell>
  )
}
