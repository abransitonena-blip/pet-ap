// Cuenta del cliente en el navegador: sesión, datos y diseños guardados
import { useCallback, useEffect, useState } from 'react'
import { api, getAccountToken, setAccountToken } from './api'

let cache = null // { account, orders }

export function useAccount() {
  const [state, setState] = useState(() => (getAccountToken() ? cache : null))
  const [loading, setLoading] = useState(Boolean(getAccountToken() && !cache))

  const refresh = useCallback(async () => {
    if (!getAccountToken()) {
      cache = null
      setState(null)
      setLoading(false)
      return null
    }
    try {
      cache = await api.account()
      setState(cache)
      return cache
    } catch (err) {
      if (err.status === 401) setAccountToken(null)
      cache = null
      setState(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const on = () => refresh()
    window.addEventListener('ap-account', on)
    return () => window.removeEventListener('ap-account', on)
  }, [refresh])

  const signIn = (session) => {
    setAccountToken(session.token)
  }
  const signOut = () => setAccountToken(null)
  return { account: state?.account || null, orders: state?.orders || [], loading, refresh, signIn, signOut }
}
