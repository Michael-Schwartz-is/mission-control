import { useCallback, useState } from 'react'
import { ConfirmDialog, type ConfirmRequest } from '@/components/ConfirmDialog'

export function useConfirmDialog() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null)
  const confirm = useCallback((nextRequest: ConfirmRequest) => {
    setRequest(nextRequest)
  }, [])
  const closeConfirm = useCallback(() => {
    setRequest(null)
  }, [])

  return {
    confirm,
    confirmationDialog: (
      <ConfirmDialog request={request} onClose={closeConfirm} />
    ),
  }
}
