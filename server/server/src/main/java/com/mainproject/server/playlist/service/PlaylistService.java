package com.mainproject.server.playlist.service;

import com.mainproject.server.exception.BusinessException;
import com.mainproject.server.exception.ExceptionCode;
import com.mainproject.server.member.entity.Member;
import com.mainproject.server.playlist.dto.PlaylistPatchDto;
import com.mainproject.server.playlist.dto.PlaylistPostDto;
import com.mainproject.server.playlist.entity.Bookmark;
import com.mainproject.server.playlist.entity.Likes;
import com.mainproject.server.playlist.entity.Playlist;
import com.mainproject.server.playlist.entity.PlaylistItem;
import com.mainproject.server.playlist.repository.BookmarkRepository;
import com.mainproject.server.playlist.repository.LikesRepository;
import com.mainproject.server.playlist.repository.PlaylistItemRepository;
import com.mainproject.server.playlist.repository.PlaylistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.redis.core.ZSetOperations;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PlaylistService {

    private final PlaylistRepository playlistRepository;
    private final PlaylistItemRepository playlistItemRepository;
    private final LikesRepository likeRepository;
    private final BookmarkRepository bookmarkRepository;
    private final String KEY = "Ranking";

    @Resource(name = "redisTemplate")
    private ZSetOperations<String, String> zSetOperations;

    // 플리 생성
    public Playlist createPlaylist(Playlist playlist, PlaylistPostDto playlistPostDto) {
//        verifyMember(member);
//        playlist.setMember(member);
        List<PlaylistItem> playlistItemList = new ArrayList<>();
        for (int i=0; i<playlistPostDto.getPlaylistItems().size(); i++) {
            PlaylistItem playlistItem = new PlaylistItem();
            playlistItem.setUrl(playlistPostDto.getPlaylistItems().get(i).getUrl());
            playlistItem.setTitle(playlistPostDto.getPlaylistItems().get(i).getTitle());
            playlistItem.setThumbnail(playlistPostDto.getPlaylistItems().get(i).getThumbnail());
            playlistItem.setChannelTitle(playlistPostDto.getPlaylistItems().get(i).getChannelTitle());
            playlistItem.setVideoId(playlistPostDto.getPlaylistItems().get(i).getVideoId());
            playlistItem.setPlaylist(playlist);
            playlistItemList.add(playlistItem);
            playlistItemRepository.save(playlistItem);
        }
        playlist.setPlaylistItems(playlistItemList);
        Playlist savedPlaylist = playlistRepository.save(playlist);

        return savedPlaylist;
    }

    //플리 수정
    public Playlist updatePlaylist(Playlist playlist, PlaylistPatchDto playlistPatchDto, Long authMemberId) {
        Playlist findPlaylist = verifiedPlaylist(playlist.getPlaylistId()); //수정할 플리가 있는지 검증

        if(findPlaylist.getMember().getMemberId() != authMemberId){
            throw new BusinessException(ExceptionCode.BAD_REQUEST);
        }

        Optional.ofNullable(playlist.getTitle()) //제목수정
                .ifPresent(title -> findPlaylist.setTitle(title));
        Optional.ofNullable(playlist.getCategoryList()) //카테고리 수정
                .ifPresent(categories -> findPlaylist.setCategoryList(categories));
        Optional.ofNullable(playlist.isStatus()) //카테고리 수정
                .ifPresent(status -> findPlaylist.setStatus(status));

        for (int i=0; i<findPlaylist.getPlaylistItems().size(); i++) {
            playlistItemRepository.delete(findPlaylist.getPlaylistItems().get(i));
        }

        List<PlaylistItem> playlistItemList = new ArrayList<>();
        for (int i=0; i<playlistPatchDto.getPlaylistItems().size(); i++) {
            PlaylistItem playlistItem = new PlaylistItem();
            playlistItem.setUrl(playlistPatchDto.getPlaylistItems().get(i).getUrl());
            playlistItem.setTitle(playlistPatchDto.getPlaylistItems().get(i).getTitle());
            playlistItem.setThumbnail(playlistPatchDto.getPlaylistItems().get(i).getThumbnail());
            playlistItem.setChannelTitle(playlistPatchDto.getPlaylistItems().get(i).getChannelTitle());
            playlistItem.setVideoId(playlistPatchDto.getPlaylistItems().get(i).getVideoId());
            playlistItem.setPlaylist(playlist);
            playlistItemList.add(playlistItem);
            playlistItemRepository.save(playlistItem);
        }
        findPlaylist.setPlaylistItems(playlistItemList);

        findPlaylist.setModifiedAt(LocalDateTime.now());

        return playlistRepository.save(findPlaylist);
    }

    //단일 조회
    public Playlist findPlaylist(long playlistId) {

        return verifiedPlaylist(playlistId);
    }

    //전체 조회
    public Page<Playlist> findPlList(int page, int size) {

        Page<Playlist> findAllPlaylist = playlistRepository.findAll(
                PageRequest.of(page, size, Sort.by("playlistId").descending()));

        return findAllPlaylist;
    }

    //플리 삭제
    public void deletePlaylist(long playlistId) {
        Playlist findPlaylist = verifiedPlaylist(playlistId);

        playlistRepository.delete(findPlaylist);
    }

    public void likePlaylist(Long playlistId, Long authMemberId) {

        // Like 해줄 플레이리스트
        Playlist playlist = verifiedPlaylist(playlistId);

        // 플레이리스트의 주인인 회원
        Member member = playlist.getMember();

        // 본인 플레이리스트에 좋아요 누르는 경우
        //if (member.getMemberId() == authMemberId){ throw new BusinessException(ExceptionCode.BAD_REQUEST);}

        // 플레이리스트 like의 합
        List<Playlist> membersPlaylist = member.getPlaylists();
        int Score = 0;

        for (Playlist pl : membersPlaylist){
            int like = pl.getLikes().size();
            Score += like;
        }

        Long LikeCount = likeRepository.findByPlaylist(playlist)// 해당 Playlist를 Like한 entity
                .stream()
                .filter(f -> f.getLikeMemberId().equals(authMemberId)) // 그안에 내가 있는 경우
                .count(); // 0, 1

        // Unlike 처리
        if (LikeCount == 1){
            // 내가 Like한 경우를 찾기
            Likes LikePlaylist = likeRepository.findByPlaylist(playlist)
                    .stream()
                    .filter(f -> f.getLikeMemberId().equals(authMemberId))
                    .findAny().get();

            // Repository에서 삭제
            likeRepository.delete(LikePlaylist);
            // 랭킹합산에서 점수 - 1
            zSetOperations.add(KEY, member.getEmail(), (double) (member.getFollows().size()+Score-1));
        }
        // Like 처리 LikeCount != 1
        else {
            // Like
            Likes LikePlaylist = new Likes();
            LikePlaylist.setLikeMemberId(authMemberId);
            LikePlaylist.setPlaylist(playlist);

            // Repository에 저장
            likeRepository.save(LikePlaylist);

            // 랭킹합산에서도 점수 + 1
            zSetOperations.add(KEY, member.getEmail(), (double) (member.getFollows().size()+Score+1));
        }
    }
    public Boolean likeState(Long playlistId, Long authMemberId){
        Playlist playlist = verifiedPlaylist(playlistId);

        Long LikeCount = likeRepository.findByPlaylist(playlist)// 해당 Playlist를 Like한 entity
                .stream()
                .filter(f -> f.getLikeMemberId().equals(authMemberId)) // 그안에 내가 있는 경우
                .count(); // 0, 1
        if (LikeCount == 1) { return true; }
        return false; // [], 0
    }

    public void bookmarkPlaylist(Long playlistId, Long authMemberId) {

        // bookmark 해줄 플레이리스트
        Playlist playlist = verifiedPlaylist(playlistId);

        // 플레이리스트의 주인인 회원
//        Member member = playlist.getMember();

        // 본인 플레이리스트를 북마크 누르는 경우
        //if (member.getMemberId() == authMemberId){ throw new BusinessException(ExceptionCode.BAD_REQUEST);}

        Long BookmarkCount = bookmarkRepository.findByPlaylist(playlist)// 해당 Playlist를 Bookmark한 entity
                .stream()
                .filter(f -> f.getBookmarkMemberId().equals(authMemberId)) // 그안에 내가 있는 경우
                .count(); // 0, 1

        // Bookmark 해제
        if (BookmarkCount == 1){
            // 내가 Bookmark한 경우를 찾기
            Bookmark bookmarkPlaylist = bookmarkRepository.findByPlaylist(playlist)
                    .stream()
                    .filter(f -> f.getBookmarkMemberId().equals(authMemberId))
                    .findAny().get();

            // Repository에서 삭제
            bookmarkRepository.delete(bookmarkPlaylist);
        }
        // Bookmark 처리 Count != 1
        else {
            // Like
            Bookmark bookmarkPlaylist = new Bookmark();
            bookmarkPlaylist.setBookmarkMemberId(authMemberId);
            bookmarkPlaylist.setPlaylist(playlist);

            // Repository에 저장
            bookmarkRepository.save(bookmarkPlaylist);
        }
    }

    public Boolean BookmarkState(Long playlistId, Long authMemberId){
        Playlist playlist = verifiedPlaylist(playlistId);

        Long BookmarkCount = bookmarkRepository.findByPlaylist(playlist)// 해당 Playlist를 Bookmark한 entity
                .stream()
                .filter(f -> f.getBookmarkMemberId().equals(authMemberId)) // 그안에 내가 있는 경우
                .count(); // 0, 1
        if (BookmarkCount == 1) { return true; }
        return false; // [], 0
    }

    public Page<Playlist> getBookmarkPlaylists(Long memberId) {

        List<Playlist> playlists = new ArrayList<>();

        // 해당 멤버가 행한 Bookmark
        List<Bookmark> bookmarkList = bookmarkRepository.findByBookmarkMemberId(memberId);

        // 북마크에 있는 플레이리스트를 List에 저장
        for (Bookmark bookmark : bookmarkList){
            Playlist playlist = playlistRepository.findById(bookmark.getPlaylist().getPlaylistId()).get();
            playlists.add(playlist);
        }
        Page<Playlist> playlistPage = new PageImpl<>(playlists);

        return playlistPage;
    }

    //존재하는 플리인지 검증
    private Playlist verifiedPlaylist(long playlistId) {
        Playlist findPlaylist = playlistRepository.findById(playlistId)
                .orElseThrow(() -> new BusinessException(ExceptionCode.PLAYLIST_NOT_EXIST));

        return findPlaylist;
    }

    //플리가 아예없을때
    private void verifiedNoPlaylist(Page<Playlist> findAllPlaylist) {
        if (findAllPlaylist.getTotalElements()==0) {
            throw new BusinessException(ExceptionCode.PLAYLIST_NOT_EXIST);
        }
    }

    //존재하는 회원인지 검증
//    private void verifyMember(Playlist playlist) {
//        memberService.verifyExistsMember(playlist.getMember().getMemberId());
//                throw new BusinessException(ExceptionCode.MEMBER_NOT_EXISTS);
//    }

//    private void verifyMember(Member member) {
//        memberRepository.findById(member.getMemberId())
//                .orElseThrow(() -> new BusinessException(ExceptionCode.MEMBER_NOT_EXISTS));
//    }
}