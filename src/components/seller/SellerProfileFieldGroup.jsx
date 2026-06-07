import { sellerFieldGroupDesc, sellerFieldGroupTitle, sellerFieldGroupWrap } from './sellerStyles'

export default function SellerProfileFieldGroup({ title, description, children }) {
  return (
    <div className={sellerFieldGroupWrap}>
      <div>
        <h3 className={sellerFieldGroupTitle}>{title}</h3>
        {description && <p className={sellerFieldGroupDesc}>{description}</p>}
      </div>
      {children}
    </div>
  )
}
