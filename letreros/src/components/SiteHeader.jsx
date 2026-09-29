import { Brand } from './ApLogo'
import Icon from './Icon'
import { useAccount } from '../lib/account'

export default function SiteHeader({ active }) {
  const { account } = useAccount()
  return (
    <header className="site-header">
      <a href="#/" className="brand-link" aria-label="Inicio">
        <Brand />
      </a>
      <nav>
        <a href="#/" className={active === 'led' ? 'active' : ''}><Icon name="bulb" size={16} /><span>Diseñar</span></a>
        <a href="#/impreso" className={active === 'editor' ? 'active' : ''}><Icon name="layers" size={16} /><span>Impreso</span></a>
        <a href="#/seguimiento" className={active === 'track' ? 'active' : ''}><Icon name="truck" size={16} /><span>Rastrear</span></a>
        <a href="#/cuenta" className={`account-link ${active === 'account' ? 'active' : ''}`}>
          {account?.picture ? <img className="avatar-img" src={account.picture} alt="" referrerPolicy="no-referrer" /> : <Icon name="user" size={16} />}
          <span>{account ? account.name.split(' ')[0] : 'Entrar'}</span>
        </a>
      </nav>
    </header>
  )
}
