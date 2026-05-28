interface AvatarProps {
  name?: string
  color?: string
}

export function Avatar({ name = 'CC', color }: AvatarProps) {
  return (
    <span className="avatar" style={color ? { background: color, color: 'white' } : undefined}>
      {name}
    </span>
  )
}
