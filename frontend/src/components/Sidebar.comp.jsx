import React, { useState, useCallback } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/auth";
import { getNavigationForRole } from "../roleAccess";
import { GridViewOutlined, StarsOutlined, QrCode2Outlined, SwapHorizOutlined, RedeemOutlined, LocalOfferOutlined, EventOutlined, ReceiptLongOutlined, PersonOutline, PointOfSaleOutlined, AssignmentTurnedInOutlined, PeopleAltOutlined, ManageAccountsOutlined, CampaignOutlined, ExpandMore, ExpandLess, DragIndicator, RestartAlt, HomeOutlined } from "@mui/icons-material";
import { IconButton, Tooltip } from "@mui/material";
import useDraggable from "../hooks/useDraggable";
import { useNotification } from "../context/notification";

const iconMap = {
    home: <HomeOutlined />,
    dashboard: <GridViewOutlined />,
    points: <StarsOutlined />,
    qr: <QrCode2Outlined />,
    transfer: <SwapHorizOutlined />,
    redemption: <RedeemOutlined />,
    promotions: <LocalOfferOutlined />,
    events: <EventOutlined />,
    transactions: <ReceiptLongOutlined />,
    profile: <PersonOutline />,
    "cashier-create": <PointOfSaleOutlined />,
    "cashier-process": <AssignmentTurnedInOutlined />,
    "cashier-create-user": <PeopleAltOutlined />,
    users: <PeopleAltOutlined />,
    settings: <ManageAccountsOutlined />,
    campaigns: <CampaignOutlined />,
};

const Sidebar = () => {
    const { currentUser, activeInterface } = useAuth();
    const { showMessage } = useNotification();
    const [showMore, setShowMore] = useState(false);

    // Add draggable functionality
    const { isDragging, isAltPressed, dragHandlers, resetPosition } = useDraggable(
        'sidebar-position',
        { top: '18px', left: '18px', right: 'auto', bottom: 'auto' }
    );

    // Prevent default Alt+Click behavior on all clickable elements
    const handleClick = useCallback((e) => {
        if (isAltPressed) {
            e.preventDefault();
            e.stopPropagation();
        }
    }, [isAltPressed]);

    // Use activeInterface if available, otherwise fall back to currentUser.role
    const effectiveRole = activeInterface || currentUser?.role;

    // get links and dedupe by `to` to avoid duplicates
    const rawLinks = currentUser ? getNavigationForRole(effectiveRole) : [];
    const seen = new Set();
    const links = rawLinks.filter(item => {
        const key = item.to || item.key || JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (!currentUser) return null;

    // Split links in half - show first half always, second half in dropdown
    const midPoint = Math.ceil(links.length / 2);
    const primaryLinks = links.slice(0, midPoint);
    const secondaryLinks = links.slice(midPoint);
    const hasSecondaryLinks = secondaryLinks.length > 0;

    return (
        <aside
            className="app-sidebar"
            {...dragHandlers}
            style={{
                ...dragHandlers.style,
                position: 'fixed',
                zIndex: isDragging ? 100 : 40,
                boxShadow: isDragging ? '0 30px 80px rgba(0, 0, 0, 0.6)' : undefined,
                outline: isAltPressed ? '2px solid rgba(124, 58, 237, 0.5)' : 'none',
                outlineOffset: '2px'
            }}
        >
            {/* Drag indicator and reset button */}
            {isAltPressed && (
                <div style={{
                    position: 'absolute',
                    top: '-32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(124, 58, 237, 0.95)',
                    padding: '4px 12px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                    zIndex: 101
                }}>
                    <DragIndicator sx={{ fontSize: 14 }} />
                    <span>Drag to move</span>
                    <Tooltip title="Reset position">
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                resetPosition();
                                showMessage('Position reset', 'success');
                            }}
                            sx={{
                                p: 0.5,
                                ml: 0.5,
                                color: '#fff',
                                '&:hover': { background: 'rgba(255,255,255,0.2)' }
                            }}
                        >
                            <RestartAlt sx={{ fontSize: 14 }} />
                        </IconButton>
                    </Tooltip>
                </div>
            )}
            <div className="app-sidebar__header">
                <div className="app-sidebar__logo">
                    <div className="app-sidebar__logo-icon"><QrCode2Outlined sx={{ color: '#fff' }} /></div>
                    <div className="app-sidebar__logo-copy">
                        <span className="app-sidebar__brand">LoyaLoop</span>
                        <small className="app-sidebar__tagline">Regular Portal</small>
                    </div>
                </div>
                <span className="app-sidebar__badge">Access</span>
            </div>

            <nav className="app-sidebar__nav" onClick={handleClick}>
                <p className="app-sidebar__nav-label">Navigation</p>
                <ul className="app-sidebar__nav-list">
                    {primaryLinks.map(link => (
                        <li key={link.to}>
                            <NavLink
                                to={link.to}
                                className={({ isActive }) => `app-sidebar__nav-link${isActive ? ' is-active' : ''}`}
                                onClick={handleClick}
                            >
                                <span className="app-sidebar__nav-icon">{iconMap[link.key] || <GridViewOutlined />}</span>
                                <span className="app-sidebar__nav-text">{link.label}</span>
                            </NavLink>
                        </li>
                    ))}
                </ul>

                {hasSecondaryLinks && (
                    <>
                        <button
                            className="app-sidebar__dropdown-toggle"
                            onClick={(e) => {
                                handleClick(e);
                                if (!isAltPressed) setShowMore(!showMore);
                            }}
                            aria-expanded={showMore}
                            aria-label={showMore ? "Show less" : "Show more"}
                        >
                            <span>More</span>
                            {showMore ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                        </button>

                        {showMore && (
                            <ul className="app-sidebar__nav-list app-sidebar__nav-list--secondary">
                                {secondaryLinks.map(link => (
                                    <li key={link.to}>
                                        <NavLink
                                            to={link.to}
                                            className={({ isActive }) => `app-sidebar__nav-link${isActive ? ' is-active' : ''}`}
                                            onClick={handleClick}
                                        >
                                            <span className="app-sidebar__nav-icon">{iconMap[link.key] || <GridViewOutlined />}</span>
                                            <span className="app-sidebar__nav-text">{link.label}</span>
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;

