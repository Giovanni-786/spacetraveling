import { GetStaticProps } from 'next';
import { getPrismicClient } from '../services/prismic';
import Prismic from '@prismicio/client';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { FiCalendar,FiUser } from "react-icons/fi";

import Link from 'next/link';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import React, { useEffect } from 'react';
import { useState } from 'react';

interface Post {
  id: string, 
  uid?: string;
  first_publication_date: string | null;
  next_page: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  }
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  posts: Post[]
  
}


export default function Home({postsPagination}:HomeProps): JSX.Element {

  
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);

  async function handleMorePostsButtonClick(): Promise<void> {
    const result = await fetch(nextPage);
    const prismicResult = await result.json();
    const newPosts = {
      ...prismicResult,
      first_publication_date: format(new Date(prismicResult.first_publication_date), "dd MMM yyyy", {
        locale: ptBR
      })

    }

    setNextPage(prismicResult.next_page);
    setPosts([...posts, ...newPosts]);
  }



  return (
      <>   
        <main className={styles.container}>
            {posts.map(post =>(    
          <div className={styles.posts}>   
             <Link href={`/post/${post.uid}`}>
              <a key={post.uid}>{post.data.title}</a>
              </Link>
              <p>{post.data.subtitle}</p>
              <div className={styles.info}>
                <p><FiUser />  {post.data.author}</p>
                <p><FiCalendar /> {post.first_publication_date}</p>
              </div>
              </div>
            ))}      
          {nextPage && (
          <button
            className={styles.morePostsButton}
            type="button"
            onClick={handleMorePostsButtonClick}
          >
            <a>Carregar mais posts</a>
          </button>
        )}
        </main>
        </>
    );

}

export const getStaticProps: GetStaticProps = async () =>{
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query([
    Prismic.predicates.at('document.type', 'posts')
  ], {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 2,
    orderings: '[document.first_publication_date desc]',
  });

  // console.log(JSON.stringify(postsResponse, null, 2));
  
  const posts = postsResponse.results.map(post => {
    return {
      id: post.id,
       uid: post.uid,
        first_publication_date: format(new Date(post.first_publication_date), "dd MMM yyyy", {
          locale: ptBR
        }),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author
        },
        next_page: postsResponse.next_page        
    };
})



const nextPost = await prismic.query(
  [Prismic.Predicates.at('document.type', 'posts')],
  {
    pageSize: 1,
    after: `${posts[0].id}`,
    orderings: '[document.first_publication_date]',
  }
);

  const postsPagination = {
    next_page: nextPost.next_page,
    results: posts
  }

    return { 
        props: {
          postsPagination,
          
        },
        revalidate: 60 * 30,
    }


}

