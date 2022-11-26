import styled from 'styled-components';
import { PlaylistInfoType } from '../../pages/PlaylistList';
import { HiHeart } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import Category from '../common/Category';
import {
	Categorys,
	Detail,
	Name,
	RoomStyle,
	SwiperTrueType,
	Thumbnail,
	ThumbnailBackdrop,
	Title,
} from './Room';

type PlaylistType = {
	playList: PlaylistInfoType;
	key?: number;
	swiper?: boolean;
};

const Playlist = ({ playList, swiper }: PlaylistType) => {
	const {
		playlistId,
		title,
		categoryList,
		like,
		memberId,
		name,
		playlistItems,
	} = playList;

	return (
		<RoomStyle>
			<Thumbnail>
				<img src={playlistItems[0].thumbnail} alt="thumbnail" />
				<Link to={`/playlistdetail/${playlistId}`}>
					<ThumbnailBackdrop />
				</Link>
			</Thumbnail>
			<Title>
				<Link to={`/playlistdetail/${playlistId}`}>{title}</Link>
			</Title>
			<Name swiper={swiper}>
				<Link to={`/mypage/${memberId}`}>{name}</Link>
			</Name>
			<Detail>
				<Categorys>
					{categoryList &&
						categoryList.map((el, idx) => (
							<Category category={el} margin="0 4px 0 0" key={idx}>
								{el}
							</Category>
						))}
				</Categorys>
				<Like swiper={swiper}>
					<HiHeart color="#f783ac" />
					{like}
				</Like>
			</Detail>
		</RoomStyle>
	);
};

export default Playlist;

const Like = styled.span<SwiperTrueType>`
	> *:first-of-type {
		margin-right: 4px;
		font-size: 17px;
	}
	display: flex;
	align-items: center;
	color: ${(props) => props.theme.colors.gray600};

	// Tablet
	@media screen and (max-width: 980px) {
		> *:first-of-type {
			margin-right: 4px;
			font-size: ${(props) => props.swiper && '15px'};
		}
		font-size: ${(props) => props.swiper && '14px'};
	}
	// Mobile
	@media screen and (max-width: 640px) {
		display: ${(props) => (props.swiper ? 'none' : 'block')};
		font-size: 14px;
	}
`;
