import type { ComponentPropsWithoutRef } from 'react'

export function Card({ className, ...rest }: ComponentPropsWithoutRef<'div'>) {
  return <div className={['card', className].filter(Boolean).join(' ')} {...rest} />
}
