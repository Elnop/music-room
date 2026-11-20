import type { PixelIconSource } from '@/shared/theme/components/PixelIcon';
import { GENRE_COLORS } from '@/shared/theme/lib/tokens';
import type { MusicGenre, VisibilityLevel } from '@/shared/users/user.types';
import GlobeSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/globe-solid.svg';
import LockSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/lock-solid.svg';
import BoltSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/bolt-solid.svg';
import CrownSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/crown-solid.svg';
import FireSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/fire-solid.svg';
import HeadphonesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/headphones-solid.svg';
import HeartSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/heart-solid.svg';
import HockeyMaskSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/hockey-mask-solid.svg';
import MoonSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/moon-solid.svg';
import RobotSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/robot-solid.svg';
import SparklesSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sparkles-solid.svg';
import SunSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/sun-solid.svg';
import UsersSolid from '@hackernoon/pixel-icon-library/icons/SVG/solid/users-solid.svg';

export const GENRE_INFO: Record<
	MusicGenre,
	{ label: string; color: string; icon: PixelIconSource }
> = {
	pop: { label: 'Pop', color: GENRE_COLORS.pop, icon: SparklesSolid },
	rock: { label: 'Rock', color: GENRE_COLORS.rock, icon: BoltSolid },
	hiphop: { label: 'Hip-Hop', color: GENRE_COLORS.hiphop, icon: HeadphonesSolid },
	rnb: { label: 'R&B', color: GENRE_COLORS.rnb, icon: HeartSolid },
	jazz: { label: 'Jazz', color: GENRE_COLORS.jazz, icon: MoonSolid },
	classical: { label: 'Classique', color: GENRE_COLORS.classical, icon: CrownSolid },
	electronic: { label: 'Électro', color: GENRE_COLORS.electronic, icon: RobotSolid },
	country: { label: 'Country', color: GENRE_COLORS.country, icon: SunSolid },
	latin: { label: 'Latino', color: GENRE_COLORS.latin, icon: FireSolid },
	metal: { label: 'Metal', color: GENRE_COLORS.metal, icon: HockeyMaskSolid },
};

export const VISIBILITY_ICONS: Record<VisibilityLevel, PixelIconSource> = {
	public: GlobeSolid,
	friends_only: UsersSolid,
	private: LockSolid,
};
