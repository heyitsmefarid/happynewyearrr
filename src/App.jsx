import { useEffect, useRef, useState } from 'react'
import './App.css'

// Firework colors - vibrant and realistic
const COLORS = {
  gold: ['#FFD700', '#FFA500', '#FFEC8B', '#DAA520', '#F4C430'],
  red: ['#FF0000', '#DC143C', '#FF4500', '#FF6347', '#CD5C5C'],
  blue: ['#00BFFF', '#1E90FF', '#4169E1', '#0080FF', '#87CEEB'],
  purple: ['#9400D3', '#8A2BE2', '#9932CC', '#BA55D3', '#DA70D6'],
  pink: ['#FF1493', '#FF69B4', '#FFB6C1', '#DB7093', '#FF00FF'],
  cyan: ['#00FFFF', '#00CED1', '#20B2AA', '#40E0D0', '#7FFFD4'],
  green: ['#00FF00', '#32CD32', '#00FA9A', '#7CFC00', '#ADFF2F'],
  white: ['#FFFFFF', '#F5F5F5', '#FFFAFA', '#F0FFFF', '#E0FFFF'],
  rainbow: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3']
}

const ALL_COLORS = Object.values(COLORS).flat()

// Firework types
const FIREWORK_TYPES = ['chrysanthemum', 'willow', 'starburst', 'peony', 'cascade', 'ring']

class Particle {
  constructor(x, y, color, velocity, type, size = 3, life = 1, gravity = 0.05, friction = 0.98) {
    this.x = x
    this.y = y
    this.color = color
    this.velocity = velocity
    this.type = type
    this.size = size
    this.life = life
    this.decay = Math.random() * 0.02 + 0.01
    this.gravity = gravity
    this.friction = friction
    this.alpha = 1
    this.trail = []
    this.maxTrailLength = type === 'willow' ? 8 : 4
    this.sparkle = Math.random() > 0.7
  }

  update() {
    this.trail.push({ x: this.x, y: this.y, alpha: this.alpha })
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift()
    }

    this.velocity.x *= this.friction
    this.velocity.y *= this.friction
    this.velocity.y += this.gravity

    this.x += this.velocity.x
    this.y += this.velocity.y
    this.life -= this.decay
    this.alpha = this.life
    this.size *= 0.98
  }

  draw(ctx) {
    // Draw simplified trail
    if (this.trail.length > 1) {
      ctx.beginPath()
      ctx.moveTo(this.trail[0].x, this.trail[0].y)
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y)
      }
      ctx.strokeStyle = this.color.replace(')', `, ${this.alpha * 0.3})`).replace('rgb', 'rgba')
      ctx.lineWidth = this.size * 0.5
      ctx.stroke()
    }

    // Draw main particle
    ctx.globalAlpha = this.alpha
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fillStyle = this.sparkle && Math.random() > 0.8 ? '#FFFFFF' : this.color
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

class Firework {
  constructor(canvas, startX, startY, targetX, targetY, colorScheme) {
    this.canvas = canvas
    this.x = startX
    this.y = startY
    this.targetX = targetX
    this.targetY = targetY
    this.colorScheme = colorScheme || ALL_COLORS
    this.distanceToTarget = Math.sqrt((targetX - startX) ** 2 + (targetY - startY) ** 2)
    this.distanceTraveled = 0
    this.trail = []
    this.trailLength = 10

    const angle = Math.atan2(targetY - startY, targetX - startX)
    const speed = 12 + Math.random() * 4
    this.velocity = {
      x: Math.cos(angle) * speed,
      y: Math.sin(angle) * speed
    }

    this.type = FIREWORK_TYPES[Math.floor(Math.random() * FIREWORK_TYPES.length)]
    this.exploded = false
    this.particles = []
    this.secondaryExplosions = []
  }

  update() {
    if (!this.exploded) {
      this.trail.push({ x: this.x, y: this.y })
      if (this.trail.length > this.trailLength) {
        this.trail.shift()
      }

      const prevX = this.x
      const prevY = this.y

      this.velocity.y += 0.03 // Slight gravity on ascent
      this.x += this.velocity.x
      this.y += this.velocity.y

      this.distanceTraveled += Math.sqrt((this.x - prevX) ** 2 + (this.y - prevY) ** 2)

      if (this.distanceTraveled >= this.distanceToTarget * 0.9 || this.velocity.y >= 0) {
        this.explode()
      }
    } else {
      // Update particles
      for (let i = this.particles.length - 1; i >= 0; i--) {
        this.particles[i].update()
        if (this.particles[i].life <= 0) {
          this.particles.splice(i, 1)
        }
      }

      // Update secondary explosions
      for (let i = this.secondaryExplosions.length - 1; i >= 0; i--) {
        this.secondaryExplosions[i].update()
        if (this.secondaryExplosions[i].life <= 0) {
          this.secondaryExplosions.splice(i, 1)
        }
      }
    }
  }

  explode() {
    this.exploded = true
    const particleCount = this.type === 'chrysanthemum' ? 80 :
                          this.type === 'peony' ? 60 :
                          this.type === 'willow' ? 50 :
                          this.type === 'starburst' ? 70 :
                          this.type === 'ring' ? 40 :
                          50

    const colors = this.colorScheme === 'rainbow' ? COLORS.rainbow :
                   Array.isArray(this.colorScheme) ? this.colorScheme :
                   COLORS[this.colorScheme] || ALL_COLORS

    const baseColor = colors[Math.floor(Math.random() * colors.length)]
    const rgb = this.hexToRgb(baseColor)
    const colorStr = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`

    switch (this.type) {
      case 'chrysanthemum':
        this.createChrysanthemum(particleCount, colorStr, colors)
        break
      case 'willow':
        this.createWillow(particleCount, colorStr)
        break
      case 'starburst':
        this.createStarburst(particleCount, colors)
        break
      case 'peony':
        this.createPeony(particleCount, colorStr, colors)
        break
      case 'spiral':
        this.createSpiral(particleCount, colors)
        break
      case 'cascade':
        this.createCascade(particleCount, colors)
        break
      case 'ring':
        this.createRing(particleCount, colors)
        break
      default:
        this.createChrysanthemum(particleCount, colorStr, colors)
    }
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 }
  }

  createChrysanthemum(count, baseColor, colors) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.2
      const speed = 4 + Math.random() * 6
      const color = Math.random() > 0.7 ?
        `rgb(${this.hexToRgb(colors[Math.floor(Math.random() * colors.length)])})`.replace('rgb([object Object])', baseColor) :
        baseColor

      this.particles.push(new Particle(
        this.x, this.y, color,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        'chrysanthemum', 2.5 + Math.random() * 2, 1, 0.04, 0.97
      ))
    }
  }

  createWillow(count, baseColor) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i
      const speed = 2 + Math.random() * 3
      this.particles.push(new Particle(
        this.x, this.y, baseColor,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        'willow', 2, 1.5, 0.08, 0.96
      ))
    }
  }

  createStarburst(count, colors) {
    const arms = 8
    const particlesPerArm = Math.floor(count / arms)
    for (let arm = 0; arm < arms; arm++) {
      const armAngle = (Math.PI * 2 / arms) * arm
      const armColor = `rgb(${Object.values(this.hexToRgb(colors[arm % colors.length])).join(',')})`
      for (let i = 0; i < particlesPerArm; i++) {
        const speed = 3 + i * 0.3
        const angleVariation = (Math.random() - 0.5) * 0.3
        this.particles.push(new Particle(
          this.x, this.y, armColor,
          { x: Math.cos(armAngle + angleVariation) * speed, y: Math.sin(armAngle + angleVariation) * speed },
          'starburst', 2.5, 1, 0.03, 0.98
        ))
      }
    }
  }

  createPeony(count, baseColor, colors) {
    // Core
    for (let i = 0; i < count * 0.3; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      this.particles.push(new Particle(
        this.x, this.y, '#FFFFFF',
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        'peony', 2, 0.8, 0.05, 0.96
      ))
    }
    // Outer layer
    for (let i = 0; i < count * 0.7; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 5 + Math.random() * 4
      this.particles.push(new Particle(
        this.x, this.y, baseColor,
        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        'peony', 3, 1, 0.04, 0.97
      ))
    }
  }

  createCascade(count, colors) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 3 + Math.random() * 5
      const color = `rgb(${Object.values(this.hexToRgb(colors[Math.floor(Math.random() * colors.length)])).join(',')})`
      this.particles.push(new Particle(
        this.x, this.y, color,
        { x: Math.cos(angle) * speed * 0.5, y: Math.sin(angle) * speed },
        'cascade', 2.5, 1.3, 0.06, 0.95
      ))
    }
  }

  createRing(count, colors) {
    const rings = 3
    for (let ring = 0; ring < rings; ring++) {
      const ringParticles = Math.floor(count / rings)
      const ringSpeed = 4 + ring * 2
      const color = `rgb(${Object.values(this.hexToRgb(colors[ring % colors.length])).join(',')})`
      for (let i = 0; i < ringParticles; i++) {
        const angle = (Math.PI * 2 / ringParticles) * i
        this.particles.push(new Particle(
          this.x, this.y, color,
          { x: Math.cos(angle) * ringSpeed, y: Math.sin(angle) * ringSpeed },
          'ring', 3, 1, 0.02, 0.99
        ))
      }
    }
  }

  draw(ctx) {
    if (!this.exploded) {
      // Draw rocket trail
      for (let i = 0; i < this.trail.length; i++) {
        const t = this.trail[i]
        const alpha = i / this.trail.length
        ctx.beginPath()
        ctx.arc(t.x, t.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.6})`
        ctx.fill()
      }

      // Draw rocket head with glow
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 10)
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
      gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.8)')
      gradient.addColorStop(1, 'rgba(255, 100, 50, 0)')
      ctx.beginPath()
      ctx.arc(this.x, this.y, 10, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()
    } else {
      // Draw particles
      for (const particle of this.particles) {
        particle.draw(ctx)
      }
    }
  }

  isDead() {
    return this.exploded && this.particles.length === 0
  }
}

// City skyline buildings
const generateBuildings = (canvas) => {
  const buildings = []
  let x = 0
  const isMobile = canvas.width < 768
  const scale = isMobile ? 0.5 : 1
  const minWidth = (30 + Math.random() * 50) * scale
  const maxWidth = (40 + Math.random() * 80) * scale
  
  while (x < canvas.width) {
    const width = minWidth + Math.random() * (maxWidth - minWidth)
    const height = (80 + Math.random() * 180) * scale
    const hasSpire = Math.random() > 0.7
    buildings.push({
      x,
      width,
      height,
      hasSpire,
      spireHeight: hasSpire ? (15 + Math.random() * 30) * scale : 0,
      windows: [],
      color: `rgb(${15 + Math.random() * 20}, ${20 + Math.random() * 25}, ${35 + Math.random() * 30})`
    })

    // Generate windows
    const windowSpacing = isMobile ? 12 : 15
    const windowHeight = isMobile ? 8 : 12
    const windowWidth = isMobile ? 5 : 8
    const windowRows = Math.floor(height / (windowSpacing + 5))
    const windowCols = Math.floor(width / windowSpacing)
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        if (Math.random() > 0.3) {
          buildings[buildings.length - 1].windows.push({
            x: x + 5 + col * windowSpacing,
            y: canvas.height - height + 8 + row * (windowSpacing + 2),
            lit: Math.random() > 0.4,
            color: Math.random() > 0.5 ? '#FFEB99' : '#FFD54F',
            width: windowWidth,
            height: windowHeight
          })
        }
      }
    }
    x += width + Math.random() * (isMobile ? 10 : 20)
  }
  return buildings
}

// Stars
const generateStars = (count, canvas) => {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.6,
      size: Math.random() * 1.5 + 0.5,
      twinkle: Math.random() * Math.PI * 2
    })
  }
  return stars
}

function App() {
  const [showIntro, setShowIntro] = useState(true)
  const [introPhase, setIntroPhase] = useState(0)
  const canvasRef = useRef(null)
  const fireworksRef = useRef([])  
  const buildingsRef = useRef([])
  const starsRef = useRef([])
  const animationRef = useRef(null)
  const confettiRef = useRef([])
  const celebrantSilhouettesRef = useRef([])

  // Cinematic intro sequence
  useEffect(() => {
    if (!showIntro) return
    
    const phases = [
      { delay: 500, phase: 1 },   // Fade in "2025"
      { delay: 2000, phase: 2 },  // Strike through, show countdown
      { delay: 3500, phase: 3 },  // "3"
      { delay: 4500, phase: 4 },  // "2"
      { delay: 5500, phase: 5 },  // "1"
      { delay: 6500, phase: 6 },  // "HAPPY NEW YEAR!"
      { delay: 8000, phase: 7 },  // "2026" explodes in
      { delay: 10500, phase: 8 }, // Fade out intro
    ]
    
    const timers = phases.map(({ delay, phase }) => 
      setTimeout(() => setIntroPhase(phase), delay)
    )
    
    const endTimer = setTimeout(() => {
      setShowIntro(false)
    }, 11500)
    
    return () => {
      timers.forEach(clearTimeout)
      clearTimeout(endTimer)
    }
  }, [showIntro])

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      buildingsRef.current = generateBuildings(canvas)
      starsRef.current = generateStars(100, canvas)
      generateCelebrants(canvas)
    }

    const generateCelebrants = (canvas) => {
      celebrantSilhouettesRef.current = []
      const count = 15 + Math.floor(Math.random() * 10)
      for (let i = 0; i < count; i++) {
        celebrantSilhouettesRef.current.push({
          x: Math.random() * canvas.width,
          height: 30 + Math.random() * 40,
          armPhase: Math.random() * Math.PI * 2,
          armSpeed: 0.05 + Math.random() * 0.05
        })
      }
    }

    resize()
    window.addEventListener('resize', resize)

    // Detect mobile for performance adjustments
    const isMobile = canvas.width < 768

    // Auto-launch fireworks
    const launchInterval = setInterval(() => {
      const maxFireworks = isMobile ? 5 : 8
      if (fireworksRef.current.length < maxFireworks) {
        launchRandomFirework(canvas)
      }
    }, isMobile ? 600 : 400)

    // Burst of multiple fireworks periodically
    const burstInterval = setInterval(() => {
      const burstCount = isMobile ? 2 + Math.floor(Math.random() * 2) : 3 + Math.floor(Math.random() * 3)
      for (let i = 0; i < burstCount; i++) {
        setTimeout(() => launchRandomFirework(canvas), i * 150)
      }
    }, isMobile ? 5000 : 4000)

    // Add confetti - reduced
    const maxConfetti = isMobile ? 30 : 50
    const confettiInterval = setInterval(() => {
      if (confettiRef.current.length < maxConfetti) {
        confettiRef.current.push({
          x: Math.random() * canvas.width,
          y: -10,
          size: (isMobile ? 3 : 5) + Math.random() * (isMobile ? 5 : 8),
          color: ALL_COLORS[Math.floor(Math.random() * ALL_COLORS.length)],
          velocity: { x: (Math.random() - 0.5) * 2, y: 2 + Math.random() * 2 },
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.2
        })
      }
    }, isMobile ? 300 : 200)

    const launchRandomFirework = (canvas) => {
      const startX = Math.random() * canvas.width
      const startY = canvas.height
      const targetX = canvas.width * 0.1 + Math.random() * canvas.width * 0.8
      const targetY = canvas.height * 0.15 + Math.random() * canvas.height * 0.35

      const colorSchemes = ['gold', 'red', 'blue', 'purple', 'pink', 'cyan', 'green', 'rainbow']
      const colorScheme = colorSchemes[Math.floor(Math.random() * colorSchemes.length)]

      fireworksRef.current.push(new Firework(canvas, startX, startY, targetX, targetY, colorScheme))
    }

    // Click/Touch to launch
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      fireworksRef.current.push(new Firework(
        canvas,
        canvas.width / 2,
        canvas.height,
        x,
        y,
        Math.random() > 0.3 ? 'rainbow' : null
      ))
    }
    
    const handleTouch = (e) => {
      e.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const touch = e.touches[0]
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top
      fireworksRef.current.push(new Firework(
        canvas,
        canvas.width / 2,
        canvas.height,
        x,
        y,
        Math.random() > 0.3 ? 'rainbow' : null
      ))
    }
    
    canvas.addEventListener('click', handleClick)
    canvas.addEventListener('touchstart', handleTouch, { passive: false })

    const drawSky = (ctx, canvas) => {
      // Deep midnight sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#0a0a1a')
      gradient.addColorStop(0.3, '#0d1529')
      gradient.addColorStop(0.6, '#15223a')
      gradient.addColorStop(1, '#1a2a4a')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    const drawStars = (ctx, time) => {
      for (const star of starsRef.current) {
        const twinkle = Math.sin(time * 0.002 + star.twinkle) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * twinkle, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.8})`
        ctx.fill()
      }
    }

    const drawBuildings = (ctx, canvas) => {
      for (const building of buildingsRef.current) {
        // Building body
        ctx.fillStyle = building.color
        ctx.fillRect(building.x, canvas.height - building.height, building.width, building.height)

        // Spire
        if (building.hasSpire) {
          ctx.beginPath()
          ctx.moveTo(building.x + building.width / 2, canvas.height - building.height - building.spireHeight)
          ctx.lineTo(building.x + building.width / 2 - 8, canvas.height - building.height)
          ctx.lineTo(building.x + building.width / 2 + 8, canvas.height - building.height)
          ctx.closePath()
          ctx.fillStyle = building.color
          ctx.fill()
        }

        // Windows
        for (const window of building.windows) {
          if (window.lit) {
            // Lit window with glow
            ctx.shadowBlur = 8
            ctx.shadowColor = window.color
            ctx.fillStyle = window.color
            ctx.fillRect(window.x, window.y, window.width || 8, window.height || 12)
            ctx.shadowBlur = 0
          } else {
            ctx.fillStyle = 'rgba(30, 40, 60, 0.8)'
            ctx.fillRect(window.x, window.y, window.width || 8, window.height || 12)
          }
        }
      }
    }

    const drawWelcome2026 = (ctx, canvas, time) => {
      const text = '✨ WELCOME 2026 ✨'
      ctx.save()

      // Position
      const x = canvas.width / 2
      const y = canvas.height * 0.1
      
      // Responsive font size
      const isMobile = canvas.width < 768
      const fontSize = isMobile ? Math.max(24, canvas.width * 0.06) : 72

      // Dynamic glow based on time
      const glowIntensity = Math.sin(time * 0.003) * 10 + 30
      const hue = (time * 0.05) % 360

      // Multiple glow layers
      ctx.font = `bold ${fontSize}px "Arial Black", Arial, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      // Outer glow
      ctx.shadowBlur = glowIntensity + 20
      ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
      ctx.fillStyle = `hsl(${hue}, 100%, 70%)`
      ctx.fillText(text, x, y)

      // Inner glow
      ctx.shadowBlur = glowIntensity
      ctx.shadowColor = '#FFD700'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(text, x, y)

      // Sparkle effect
      ctx.shadowBlur = 0
      const sparkleCount = isMobile ? 10 : 20
      const sparkleSpread = isMobile ? canvas.width * 0.4 : 300
      for (let i = 0; i < sparkleCount; i++) {
        const sparkleX = x - sparkleSpread + (i / sparkleCount) * sparkleSpread * 2
        const sparkleY = y + Math.sin(time * 0.01 + i) * (isMobile ? 10 : 20)
        const sparkleSize = Math.sin(time * 0.005 + i * 0.5) * 2 + 2
        ctx.beginPath()
        ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`
        ctx.fill()
      }

      ctx.restore()
    }

    const drawCelebrants = (ctx, canvas, time) => {
      const isMobile = canvas.width < 768
      const scale = isMobile ? 0.6 : 1
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
      for (const person of celebrantSilhouettesRef.current) {
        const armOffset = Math.sin(time * person.armSpeed + person.armPhase) * 15 * scale
        const personHeight = person.height * scale
        const bodyWidth = 8 * scale
        const headSize = 8 * scale
        const lineWidth = 4 * scale

        // Body
        ctx.beginPath()
        ctx.ellipse(person.x, canvas.height - personHeight / 2, bodyWidth, personHeight / 2, 0, 0, Math.PI * 2)
        ctx.fill()

        // Head
        ctx.beginPath()
        ctx.arc(person.x, canvas.height - personHeight - headSize, headSize, 0, Math.PI * 2)
        ctx.fill()

        // Arms raised
        ctx.beginPath()
        ctx.moveTo(person.x - 5 * scale, canvas.height - personHeight * 0.7)
        ctx.lineTo(person.x - 20 * scale + armOffset, canvas.height - personHeight - 20 * scale)
        ctx.lineWidth = lineWidth
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.9)'
        ctx.stroke()

        ctx.beginPath()
        ctx.moveTo(person.x + 5 * scale, canvas.height - personHeight * 0.7)
        ctx.lineTo(person.x + 20 * scale - armOffset, canvas.height - personHeight - 20 * scale)
        ctx.stroke()
      }
    }

    const drawConfetti = (ctx) => {
      for (let i = confettiRef.current.length - 1; i >= 0; i--) {
        const c = confettiRef.current[i]
        c.x += c.velocity.x
        c.y += c.velocity.y
        c.velocity.y += 0.05
        c.velocity.x *= 0.99
        c.rotation += c.rotationSpeed

        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate(c.rotation)
        ctx.fillStyle = c.color
        ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2)
        ctx.restore()

        if (c.y > ctx.canvas.height) {
          confettiRef.current.splice(i, 1)
        }
      }
    }



    const animate = (time) => {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw sky
      drawSky(ctx, canvas)

      // Draw stars
      drawStars(ctx, time)

      // Update and draw fireworks
      for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
        const firework = fireworksRef.current[i]
        firework.update()
        firework.draw(ctx)

        if (firework.isDead()) {
          fireworksRef.current.splice(i, 1)
        }
      }

      // Draw confetti
      drawConfetti(ctx)

      // Draw buildings
      drawBuildings(ctx, canvas)

      // Draw celebrant silhouettes
      drawCelebrants(ctx, canvas, time)

      // Draw welcome text
      drawWelcome2026(ctx, canvas, time)

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      canvas.removeEventListener('click', handleClick)
      canvas.removeEventListener('touchstart', handleTouch)
      clearInterval(launchInterval)
      clearInterval(burstInterval)
      clearInterval(confettiInterval)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="app-container">
      {/* Cinematic Intro Overlay */}
      {showIntro && (
        <div className={`intro-overlay ${introPhase >= 8 ? 'fade-out' : ''}`}>
          <div className="intro-content">
            {/* Stars background */}
            <div className="intro-stars">
              {[...Array(50)].map((_, i) => (
                <div 
                  key={i} 
                  className="intro-star"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    transform: `scale(${0.5 + Math.random()})`
                  }}
                />
              ))}
            </div>
            
            {/* Year 2025 with strikethrough */}
            <div className={`intro-year-old ${introPhase >= 1 ? 'visible' : ''} ${introPhase >= 2 ? 'strike' : ''}`}>
              2025
            </div>
            
            {/* Countdown */}
            {introPhase >= 3 && introPhase < 6 && (
              <div className="countdown">
                <span className={`countdown-number ${introPhase === 3 ? 'active' : 'past'}`}>3</span>
                <span className={`countdown-number ${introPhase === 4 ? 'active' : introPhase > 4 ? 'past' : ''}`}>2</span>
                <span className={`countdown-number ${introPhase === 5 ? 'active' : ''}`}>1</span>
              </div>
            )}
            
            {/* Happy New Year */}
            {introPhase >= 6 && (
              <div className="happy-new-year">
                <div className="hny-line hny-happy">✨ HAPPY ✨</div>
                <div className="hny-line hny-new">NEW</div>
                <div className="hny-line hny-year">YEAR</div>
              </div>
            )}
            
            {/* 2026 Explosion */}
            {introPhase >= 7 && (
              <div className="year-2026">
                <span className="digit">2</span>
                <span className="digit">0</span>
                <span className="digit">2</span>
                <span className="digit">6</span>
              </div>
            )}
            
            {/* Sparkle effects */}
            {introPhase >= 6 && (
              <div className="intro-sparkles">
                {[...Array(20)].map((_, i) => (
                  <div 
                    key={i} 
                    className="sparkle"
                    style={{
                      left: `${10 + Math.random() * 80}%`,
                      top: `${10 + Math.random() * 80}%`,
                      animationDelay: `${Math.random() * 0.5}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} className="fireworks-canvas" />
      {!showIntro && (
        <div className="hint">Tap anywhere to launch fireworks!</div>
      )}
    </div>
  )
}

export default App
