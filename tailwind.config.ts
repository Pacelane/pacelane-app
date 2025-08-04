import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			// Enhanced spacing for better layout
			spacing: {
				'4': '4px',
				'8': '8px',
				'12': '12px',
				'16': '16px',
				'20': '20px',
				'24': '24px',
				'28': '28px',
				'32': '32px',
				'36': '36px',
				'40': '40px',
				'44': '44px',
				'48': '48px',
				'52': '52px',
				'56': '56px',
				'60': '60px',
				'64': '64px',
				'68': '68px',
				'72': '72px',
				'76': '76px',
				'80': '80px',
				'84': '84px',
				'88': '88px',
				'92': '92px',
				'96': '96px',
				'100': '100px',
				'104': '104px',
				'108': '108px',
				'112': '112px',
				'116': '116px',
				'120': '120px',
				'124': '124px',
				'128': '128px',
				'132': '132px',
				'136': '136px',
				'140': '140px',
				'144': '144px',
				'148': '148px',
				'152': '152px',
				'156': '156px',
				'160': '160px',
			},
			// Enhanced font families
			fontFamily: {
				'inter': ['Inter', 'sans-serif'],
				'fraunces': ['Fraunces', 'serif'],
				'jetbrains-mono': ['JetBrains Mono', 'monospace'],
				'awesome-serif': ['Awesome Serif VAR', 'serif'],
			},
			// Enhanced font sizes
			fontSize: {
				'xs': ['12px', { lineHeight: '16px' }],
				'sm': ['14px', { lineHeight: '20px' }],
				'base': ['16px', { lineHeight: '24px' }],
				'lg': ['18px', { lineHeight: '28px' }],
				'xl': ['20px', { lineHeight: '28px' }],
				'2xl': ['24px', { lineHeight: '32px' }],
				'3xl': ['30px', { lineHeight: '36px' }],
				'4xl': ['36px', { lineHeight: '40px' }],
				'5xl': ['48px', { lineHeight: '48px' }],
				'6xl': ['60px', { lineHeight: '60px' }],
			},
			// Enhanced border radius
			borderRadius: {
				'sm': '4px',
				'base': '6px',
				'md': '8px',
				'lg': '12px',
				'xl': '16px',
				'2xl': '20px',
				'3xl': '24px',
			},
			// Keep existing shadcn colors for compatibility
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
			primary: {
				DEFAULT: 'hsl(var(--primary))',
				foreground: 'hsl(var(--primary-foreground))'
			},
			secondary: {
				DEFAULT: 'hsl(var(--secondary))',
				foreground: 'hsl(var(--secondary-foreground))'
			},
			destructive: {
				DEFAULT: 'hsl(var(--destructive))',
				foreground: 'hsl(var(--destructive-foreground))'
			},
			muted: {
				DEFAULT: 'hsl(var(--muted))',
				foreground: 'hsl(var(--muted-foreground))'
			},
			accent: {
				DEFAULT: 'hsl(var(--accent))',
				foreground: 'hsl(var(--accent-foreground))'
			},
			popover: {
				DEFAULT: 'hsl(var(--popover))',
				foreground: 'hsl(var(--popover-foreground))'
			},
			card: {
				DEFAULT: 'hsl(var(--card))',
				foreground: 'hsl(var(--card-foreground))'
			},
			},
			sidebar: {
				DEFAULT: 'hsl(var(--sidebar-background))',
				foreground: 'hsl(var(--sidebar-foreground))',
				primary: 'hsl(var(--sidebar-primary))',
				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
				accent: 'hsl(var(--sidebar-accent))',
				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
				border: 'hsl(var(--sidebar-border))',
				ring: 'hsl(var(--sidebar-ring))'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
