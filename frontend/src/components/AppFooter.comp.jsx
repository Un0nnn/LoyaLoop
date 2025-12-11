import React from 'react';
import { Typography, Link as MuiLink, Stack, IconButton, Box, Divider } from '@mui/material';
import QrCode2RoundedIcon from '@mui/icons-material/QrCode2Rounded';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import LinkedInIcon from '@mui/icons-material/LinkedIn';

const sections = [
    {
        title: 'Product',
        links: [
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Promotions', href: '/promotions' },
            { label: 'Events', href: '/events' },
            { label: 'Redemptions', href: '/redemption' },
            { label: 'Transfer Points', href: '/transfer' },
        ],
    },
    {
        title: 'Support',
        links: [
            { label: 'Help Center', href: '/support' },
            { label: 'Report Issue', href: '/support?tab=issues' },
            { label: 'Contact Us', href: 'mailto:support@loyaloop.com' },
            { label: 'FAQ', href: '/faq' },
        ],
    },
    {
        title: 'Company',
        links: [
            { label: 'About Us', href: '/about' },
            { label: 'Careers', href: '/careers' },
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
        ],
    },
    {
        title: 'Resources',
        links: [
            { label: 'Documentation', href: '/docs' },
            { label: 'API Reference', href: '/api-docs' },
            { label: 'Community', href: '/community' },
            { label: 'Blog', href: '/blog' },
        ],
    },
];

const AppFooter = () => (
    <footer className="app-footer">
        <Box className="app-footer__inner" sx={{ position: 'relative', zIndex: 1 }}>
            {/* Brand Section */}
            <Box className="app-footer__brand" sx={{ flex: { xs: '1 1 100%', md: '1 1 280px' } }}>
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Box className="app-footer__logo" sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '16px',
                        background: 'linear-gradient(135deg, #7C3AED, #4C1D95)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)'
                    }}>
                        <QrCode2RoundedIcon sx={{ fontSize: 32, color: '#fff' }} />
                    </Box>
                    <Box>
                        <Typography variant="h5" sx={{
                            fontWeight: 800,
                            letterSpacing: '-0.02em',
                            background: 'linear-gradient(135deg, #fff, #E0E7FF)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>
                            LoyaLoop
                        </Typography>
                        <Typography variant="caption" sx={{
                            color: 'rgba(255, 255, 255, 0.5)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                            fontSize: '0.7rem'
                        }}>
                            Rewards Portal
                        </Typography>
                    </Box>
                </Stack>
                <Typography variant="body2" sx={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    mb: 3,
                    lineHeight: 1.7,
                    maxWidth: 320
                }}>
                    Earn, redeem, and track loyalty rewards across every touchpoint. Empowering connections through seamless reward management.
                </Typography>

                {/* Social Links */}
                <Stack direction="row" spacing={1} className="app-footer__socials">
                    <IconButton
                        size="small"
                        aria-label="Email support"
                        href="mailto:support@loyaloop.com"
                        sx={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                background: 'rgba(124, 58, 237, 0.2)',
                                borderColor: 'rgba(124, 58, 237, 0.4)'
                            }
                        }}
                    >
                        <MailOutlineIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="Twitter"
                        href="https://twitter.com/"
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                background: 'rgba(6, 182, 212, 0.2)',
                                borderColor: 'rgba(6, 182, 212, 0.4)'
                            }
                        }}
                    >
                        <TwitterIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="LinkedIn"
                        href="https://linkedin.com/"
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                background: 'rgba(16, 185, 129, 0.2)',
                                borderColor: 'rgba(16, 185, 129, 0.4)'
                            }
                        }}
                    >
                        <LinkedInIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                        size="small"
                        aria-label="GitHub"
                        href="https://github.com/"
                        target="_blank"
                        rel="noreferrer"
                        sx={{
                            background: 'rgba(255, 255, 255, 0.08)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            '&:hover': {
                                background: 'rgba(255, 255, 255, 0.15)',
                                borderColor: 'rgba(255, 255, 255, 0.25)'
                            }
                        }}
                    >
                        <GitHubIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Stack>
            </Box>

            {/* Links Section */}
            <Box className="app-footer__columns" sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
                gap: { xs: 3, md: 4 },
                flex: { xs: '1 1 100%', md: '2 1 600px' }
            }}>
                {sections.map(section => (
                    <Box key={section.title} className="app-footer__column">
                        <Typography
                            variant="subtitle2"
                            className="app-footer__column-title"
                            sx={{
                                textTransform: 'uppercase',
                                letterSpacing: '0.12em',
                                fontSize: '0.75rem',
                                color: 'rgba(255, 255, 255, 0.5)',
                                mb: 2,
                                fontWeight: 700
                            }}
                        >
                            {section.title}
                        </Typography>
                        <Stack spacing={1.5}>
                            {section.links.map(link => (
                                <MuiLink
                                    key={link.label}
                                    href={link.href}
                                    underline="none"
                                    className="app-footer__link"
                                    sx={{
                                        color: 'rgba(255, 255, 255, 0.75)',
                                        fontSize: '0.9rem',
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            color: '#fff',
                                            transform: 'translateX(4px)'
                                        }
                                    }}
                                >
                                    {link.label}
                                </MuiLink>
                            ))}
                        </Stack>
                    </Box>
                ))}
            </Box>
        </Box>

        <Divider sx={{
            borderColor: 'rgba(255, 255, 255, 0.08)',
            my: 4
        }} />

        {/* Meta Section */}
        <Box className="app-footer__meta" sx={{
            maxWidth: 'var(--max-content-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 2
        }}>
            <Typography variant="body2" sx={{
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '0.85rem'
            }}>
                © {new Date().getFullYear()} LoyaLoop. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3} className="app-footer__meta-links">
                <MuiLink
                    href="/terms"
                    underline="none"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.85rem',
                        '&:hover': {
                            color: '#fff'
                        }
                    }}
                >
                    Terms
                </MuiLink>
                <MuiLink
                    href="/privacy"
                    underline="none"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.85rem',
                        '&:hover': {
                            color: '#fff'
                        }
                    }}
                >
                    Privacy
                </MuiLink>
                <MuiLink
                    href="/accessibility"
                    underline="none"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.85rem',
                        '&:hover': {
                            color: '#fff'
                        }
                    }}
                >
                    Accessibility
                </MuiLink>
                <MuiLink
                    href="/cookies"
                    underline="none"
                    sx={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '0.85rem',
                        '&:hover': {
                            color: '#fff'
                        }
                    }}
                >
                    Cookies
                </MuiLink>
            </Stack>
        </Box>
    </footer>
);

export default AppFooter;

