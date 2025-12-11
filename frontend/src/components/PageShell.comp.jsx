import React from "react";
import PropTypes from 'prop-types';
import RightRail from './RightRail.comp';

const PageShell = ({ title, subtitle, actions, stats, align = 'left', showRail = false, hero, children }) => {
    const railClass = showRail ? 'page-shell--with-rail' : 'page-shell--single';

    return (
        <div className={`page-shell ${railClass} page-shell--left`}>
            <div className="page-shell__inner">
                {title && (
                    <header className="page-header">
                        <div>
                            <h1 className="page-header__title">{title}</h1>
                        </div>
                        {actions && <div className="page-header__actions">{actions}</div>}
                    </header>
                )}
                <div className="page-shell__content">
                    {hero && (
                        <section className="page-shell__hero">
                            {hero}
                        </section>
                    )}
                    {children}
                </div>
            </div>
            {showRail && <RightRail />}
        </div>
    );
};

PageShell.propTypes = {
    title: PropTypes.string,
    subtitle: PropTypes.string,
    actions: PropTypes.node,
    stats: PropTypes.arrayOf(PropTypes.shape({ label: PropTypes.string, value: PropTypes.node })),
    align: PropTypes.oneOf(['left', 'center']),
    showRail: PropTypes.bool,
    hero: PropTypes.node,
    children: PropTypes.node.isRequired,
};

export default PageShell;
