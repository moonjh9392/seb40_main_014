import { Link, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import LogoImg from '../../assets/images/header-logo.png';
import { useCallback, useState, useEffect, useRef } from 'react';
import LoginModal, { Backdrop } from './LoginModal';
import PcUl from './PcUl';
import MobileUl from './MobileUl';
import { RiMenuFoldLine, RiMenuUnfoldLine } from 'react-icons/ri';
import { useDispatch, useSelector } from 'react-redux';
import { myLogin, myLogout, myValue } from '../../slices/mySlice';
import { logout } from '../../api/authApi';
import { BiUser } from 'react-icons/bi';
import { MdLogout } from 'react-icons/md';
import { BsFillTriangleFill } from 'react-icons/bs';

function Header() {
	const dispatch = useDispatch();
	const { pathname } = useLocation();

	const { name, picture } = useSelector(myValue);
	const isLogin = useSelector(myLogin);

	useEffect(() => {
		console.log('isLogin', isLogin);
	}, [isLogin]);

	const profileRef = useRef<HTMLDivElement>(null);
	const profileUlRef = useRef<HTMLUListElement>(null);

	const [position, setPosition] = useState('fixed');
	const [isOpenModal, setOpenModal] = useState(false);
	const [isOpenSide, setOpenSide] = useState(false);
	const [currentMenu, setCurrentMenu] = useState('');

	// 로그아웃
	const handleLogout = () => {
		logout().then((res) => {
			console.log('logout res', res);
			localStorage.removeItem('accessToken');
			localStorage.removeItem('refreshToken');
			dispatch(myLogout());
		});
	};

	const handleOpenModal = useCallback(() => {
		setOpenModal(!isOpenModal);
	}, [isOpenModal]);

	const handleOpenSide = useCallback(() => {
		setOpenSide(!isOpenSide);
	}, [isOpenSide]);

	const handleOpenProfileUl = ({ target }) => {
		if (!profileRef.current) return;

		if (profileRef.current.contains(target)) {
			profileUlRef.current.style.display = 'block';
		} else {
			profileUlRef.current.style.display = 'none';
		}
	};

	useEffect(() => {
		if (pathname === '/') setCurrentMenu('room');
		else setCurrentMenu(pathname.slice(1));
	}, [pathname]);

	useEffect(() => {
		window.addEventListener('mouseover', handleOpenProfileUl);
		return () => {
			window.removeEventListener('mouseover', handleOpenProfileUl);
		};
	});

	useEffect(() => {
		if (pathname.slice(0, 6) === '/rooms') {
			setPosition('relative');
		} else {
			setPosition('fixed');
		}
	});

	return (
		<>
			<HeaderStyle position={position}>
				<Logo>
					<Link to="/">
						<img src={LogoImg} alt="logo" />
					</Link>
				</Logo>
				<div className="on-pc">
					<PcUl currentMenu={currentMenu} />
				</div>
				{isOpenSide && (
					<div className="on-mobile">
						<MobileUl
							currentMenu={currentMenu}
							setOpenModal={setOpenModal}
							handleOpenSide={handleOpenSide}
						/>
					</div>
				)}
				{isLogin ? (
					<>
						<Profile ref={profileRef}>
							<Img
								style={{ background: `url(${picture.replace('96', '32')})` }}>
								{/* <div
									style={{
										width: '32px',
										height: '32px',
										borderRadius: '32px',
										background: `url(${picture.replace('96', '32')})`,
									}}
								/> */}
							</Img>
							<div className="on-pc">{name}</div>
							<ProfileUl ref={profileUlRef}>
								<Triangle>
									<BsFillTriangleFill />
								</Triangle>
								<MyPageLink>
									<Link to="/mypage">
										<BiUser />
										<span>마이페이지</span>
									</Link>
								</MyPageLink>
								<LogoutButton onClick={handleLogout}>
									<MdLogout />
									<span>로그아웃</span>
								</LogoutButton>
							</ProfileUl>
						</Profile>
					</>
				) : (
					<LoginButton onClick={handleOpenModal} className="on-pc">
						로그인
					</LoginButton>
				)}
				<Hambuger className="on-mobile" onClick={handleOpenSide}>
					{isOpenSide ? <RiMenuUnfoldLine /> : <RiMenuFoldLine />}
				</Hambuger>
			</HeaderStyle>
			{isOpenModal && <LoginModal handleOpenModal={handleOpenModal} />}
			{isOpenSide && (
				<Backdrop
					onClick={(e) => {
						e.preventDefault();
						handleOpenSide();
					}}
				/>
			)}
		</>
	);
}

export default Header;

const HeaderStyle = styled.div<{ position: string }>`
	position: ${(props) =>
		props.position === 'relative' ? 'relative' : 'fixed'};
	top: 0;
	width: 100vw;
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 17px 15vw;
	background-color: ${(props) => props.theme.colors.headerBackground};
	font-size: 18px;
	z-index: 6666;

	.on-pc {
		display: block;
	}
	.on-mobile {
		display: none;
	}

	// Tablet
	@media screen and (max-width: 980px) {
		padding: 20px 80px;
	}
	// Mobile
	@media screen and (max-width: 640px) {
		padding: 20px 40px;
		font-size: ${(props) => props.theme.fontSize.medium};
		z-index: 9999;

		.on-pc {
			display: none;
		}
		.on-mobile {
			display: block;
		}
	}
`;

const Logo = styled.div`
	width: 110px;
	img {
		width: 100%;
	}
`;

export const LoginButton = styled.button`
	color: ${(props) => props.theme.colors.gray400};

	&:hover {
		color: ${(props) => props.theme.colors.white};
	}

	// Mobile
	@media screen and (max-width: 640px) {
		color: ${(props) => props.theme.colors.gray800};
		&:hover {
			color: ${(props) => props.theme.colors.purple};
		}
	}
`;

const Hambuger = styled.div`
	color: ${(props) => props.theme.colors.gray400};
	font-size: ${(props) => props.theme.fontSize.large};
	transition: 0.1s;
	cursor: pointer;

	&:hover {
		color: ${(props) => props.theme.colors.white};
	}
`;

const Profile = styled.div`
	position: relative;
	display: flex;
	align-items: center;
	color: ${(props) => props.theme.colors.gray400};
	font-size: ${(props) => props.theme.fontSize.medium};
	cursor: pointer;

	// Mobile
	@media screen and (max-width: 640px) {
		position: absolute;
		right: 68px;
	}
`;

const Img = styled.div`
	width: 30px;
	height: 31px;
	border-radius: 31px;
	margin-right: 15px;
`;

const ProfileUl = styled.ul`
	display: none;
	position: absolute;
	top: 50px;
	left: -11px;
	padding: 20px;
	width: 150px;
	background-color: ${(props) => props.theme.colors.background};
	color: ${(props) => props.theme.colors.gray900};
	border-radius: ${(props) => props.theme.radius.smallRadius};
	box-shadow: 1px 1px 10px 2px rgba(30, 30, 30, 0.185);
	z-index: 9999;

	> * {
		padding: 5px;

		span {
			margin-left: 10px;
		}

		&:hover {
			color: ${(props) => props.theme.colors.gray700};
		}
	}

	// Mobile
	@media screen and (max-width: 640px) {
		top: 46px;
		left: -52px;
		padding: 17px;
		width: 135px;
		font-size: ${(props) => props.theme.fontSize.small};
	}
`;

const Triangle = styled.div`
	position: absolute;
	top: -26px;
	left: 0;
	padding: 15px 68px 0 68px;
	color: ${(props) => props.theme.colors.background};
	font-size: ${(props) => props.theme.fontSize.small};

	&:hover {
		color: ${(props) => props.theme.colors.background};
	}

	// Mobile
	@media screen and (max-width: 640px) {
		top: -24px;
		padding: 15px 60.5px 0 60.5px;
	}
`;

const MyPageLink = styled.div``;

const LogoutButton = styled.button`
	margin-top: 8px;

	// Mobile
	@media screen and (max-width: 640px) {
		margin-top: 6px;
	}
`;